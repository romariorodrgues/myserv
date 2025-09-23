import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"
import GoogleMapsServerService from "@/lib/maps-server";
import { ClientProfileData } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      address: true,
      clientProfile: {
        include: {
          preferences: true,
          privacy: true,
        },
      },
      serviceProvider: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            include: {
              plan: true,
            },
          },
          activePlan: true,
        },
      },
    },
  });

  if (!user) {
    const fallback: ClientProfileData = {
      id: session.user.id,
      name: session.user.name ?? 'Usuário',
      email: session.user.email ?? '',
      phone: session.user.phone ?? '',
      cpfCnpj: '',
      description: '',
      userType: session.user.userType,
      profileImage: session.user.image ?? '',
      address: undefined,
      preferences: undefined,
      privacy: undefined,
      serviceProviderSettings: session.user.userType === 'SERVICE_PROVIDER'
        ? {
            chargesTravel: false,
            serviceRadiusKm: undefined,
            waivesTravelOnHire: false,
          }
        : undefined,
      plan: 'Start',
    }

    return NextResponse.json({ user: fallback, missingProfile: true })
  }

  const activeSubscription = user.serviceProvider?.subscriptions?.[0];
  const planName =
    activeSubscription?.plan?.name ?? user.serviceProvider?.activePlan?.name ?? "Start";

  const responseData: ClientProfileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    cpfCnpj: user.cpfCnpj,
    description: user.description ?? "",
    userType: user.userType,
    profileImage: user.profileImage,
    address: user.address
      ? {
          street: user.address.street,
          number: user.address.number,
          district: user.address.district,
          city: user.address.city,
          state: user.address.state,
          zipCode: user.address.zipCode,
          complement: user.address.complement ?? "",
        }
      : undefined,
    preferences: user.clientProfile
      ?.preferences as ClientProfileData["preferences"],
    privacy: user.clientProfile?.privacy as ClientProfileData["privacy"],
    serviceProviderSettings: user.serviceProvider
      ? {
          chargesTravel: user.serviceProvider.chargesTravel,
          travelCost: user.serviceProvider.travelCost ?? undefined,
          travelRatePerKm: user.serviceProvider.travelRatePerKm ?? undefined,
          travelMinimumFee: user.serviceProvider.travelMinimumFee ?? undefined,
          serviceRadiusKm: user.serviceProvider.serviceRadiusKm ?? undefined,
          waivesTravelOnHire: user.serviceProvider.waivesTravelOnHire,
        }
      : undefined,
    plan: planName,
  };

  return NextResponse.json({ user: responseData });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Partial<ClientProfileData & { profileImageKey?: string | null }> = await req.json();

  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, userType: true },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: 'Usuário não encontrado ou sessão expirada' },
      { status: 404 }
    );
  }

  let geocodedAddress = null as Awaited<ReturnType<typeof GoogleMapsServerService.geocodeAddress>>;
  const providerSettings = body.serviceProviderSettings;

  if (body.address) {
    const parts = [
      body.address.street && body.address.number
        ? `${body.address.street}, ${body.address.number}`
        : body.address.street,
      body.address.district,
      body.address.city,
      body.address.state,
      body.address.zipCode
    ].filter(Boolean)

    if (parts.length) {
      try {
        geocodedAddress = await GoogleMapsServerService.geocodeAddress(parts.join(', '))
      } catch (error) {
        console.error('[PUT /api/users/me] geocode error', error)
        geocodedAddress = null
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Atualiza dados básicos do usuário
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          name: body.name,
          phone: body.phone,
          email: body.email,
          profileImage:
            body.profileImageKey !== undefined
              ? body.profileImageKey
              : body.profileImage ?? undefined,
          description: body.description ?? undefined,
          cpfCnpj: body.cpfCnpj,
          address: body.address
            ? {
                upsert: {
                  create: {
                    state: body.address.state!,
                    city: body.address.city!,
                    district: body.address.district!,
                    street: body.address.street!,
                    number: body.address.number!,
                    zipCode: body.address.zipCode!,
                    complement: body.address.complement ?? "",
                    latitude: geocodedAddress?.latitude ?? body.address.latitude ?? null,
                    longitude: geocodedAddress?.longitude ?? body.address.longitude ?? null,
                  },
                  update: {
                    state: body.address.state!,
                    city: body.address.city!,
                    district: body.address.district!,
                    street: body.address.street!,
                    number: body.address.number!,
                    zipCode: body.address.zipCode!,
                    complement: body.address.complement ?? "",
                    latitude: geocodedAddress?.latitude ?? body.address.latitude ?? null,
                    longitude: geocodedAddress?.longitude ?? body.address.longitude ?? null,
                  },
                },
              }
            : undefined,
          serviceProvider:
            existingUser.userType === 'SERVICE_PROVIDER' && providerSettings
              ? {
                  upsert: {
                    create: {
                      hasQuoting: true,
                      hasScheduling: false,
                      chargesTravel: providerSettings.chargesTravel,
                      travelCost: providerSettings.travelCost ?? null,
                      travelRatePerKm: providerSettings.travelRatePerKm ?? null,
                      travelMinimumFee: providerSettings.travelMinimumFee ?? null,
                      serviceRadiusKm: providerSettings.serviceRadiusKm ?? null,
                      waivesTravelOnHire: providerSettings.waivesTravelOnHire,
                    },
                    update: {
                      chargesTravel: providerSettings.chargesTravel,
                      travelCost: providerSettings.travelCost ?? null,
                      travelRatePerKm: providerSettings.travelRatePerKm ?? null,
                      travelMinimumFee: providerSettings.travelMinimumFee ?? null,
                      serviceRadiusKm: providerSettings.serviceRadiusKm ?? null,
                      waivesTravelOnHire: providerSettings.waivesTravelOnHire,
                    },
                  },
                }
              : undefined,
        },
      });

      const profile = await tx.clientProfile.upsert({
        where: { userId: existingUser.id },
        update: {},
        create: { userId: existingUser.id },
      });

      // Preferences
      if (body.preferences) {
        await tx.clientPreferences.upsert({
          where: { clientProfileId: profile.id },
          update: { ...body.preferences },
          create: { clientProfileId: profile.id, ...body.preferences },
        });
      }

      // Privacy
      if (body.privacy) {
        await tx.clientPrivacy.upsert({
          where: { clientProfileId: profile.id },
          update: { ...body.privacy },
          create: { clientProfileId: profile.id, ...body.privacy },
        });
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        address: true,
        clientProfile: {
          include: {
            preferences: true,
            privacy: true,
          },
        },
        serviceProvider: {
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              include: {
                plan: true,
              },
            },
            activePlan: true,
          },
        },
      },
    });

    const updatedActiveSubscription =
      updatedUser?.serviceProvider?.subscriptions?.[0];
    const updatedPlanName =
      updatedActiveSubscription?.plan?.name ??
      updatedUser?.serviceProvider?.activePlan?.name ??
      "Start";

    const responseData: ClientProfileData = {
      id: updatedUser!.id,
      name: updatedUser!.name,
      email: updatedUser!.email,
      phone: updatedUser!.phone,
      cpfCnpj: updatedUser!.cpfCnpj,
      description: updatedUser!.description ?? "",
      userType: updatedUser!.userType,
      profileImage: updatedUser!.profileImage ?? "",
      address: updatedUser!.address
        ? {
            street: updatedUser!.address.street,
            number: updatedUser!.address.number,
            district: updatedUser!.address.district,
            city: updatedUser!.address.city,
            state: updatedUser!.address.state,
            zipCode: updatedUser!.address.zipCode,
            complement: updatedUser!.address.complement ?? "",
            latitude: updatedUser!.address.latitude ?? undefined,
            longitude: updatedUser!.address.longitude ?? undefined,
          }
        : undefined,
      preferences: updatedUser!.clientProfile
        ?.preferences as ClientProfileData["preferences"],
      privacy: updatedUser!.clientProfile
        ?.privacy as ClientProfileData["privacy"],
      serviceProviderSettings: updatedUser!.serviceProvider
        ? {
            chargesTravel: updatedUser!.serviceProvider.chargesTravel,
            travelCost: updatedUser!.serviceProvider.travelCost ?? undefined,
            travelRatePerKm: updatedUser!.serviceProvider.travelRatePerKm ?? undefined,
            travelMinimumFee: updatedUser!.serviceProvider.travelMinimumFee ?? undefined,
            serviceRadiusKm: updatedUser!.serviceProvider.serviceRadiusKm ?? undefined,
            waivesTravelOnHire: updatedUser!.serviceProvider.waivesTravelOnHire,
          }
        : undefined,
      plan: updatedPlanName,
    };

    return NextResponse.json({ user: responseData });
  } catch (error) {
    console.error("[PUT /me]", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuário não encontrado para atualização' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
