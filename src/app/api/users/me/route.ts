import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

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
    plan: user.serviceProvider?.subscriptions[0].plan.name ?? "Start",
  };

  return NextResponse.json({ user: responseData });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Partial<ClientProfileData> = await req.json();

  try {
    await prisma.$transaction(async (tx) => {
      // Atualiza dados básicos do usuário
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: body.name,
          phone: body.phone,
          email: body.email,
          profileImage: body.profileImage ?? undefined,
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
                  },
                  update: {
                    state: body.address.state!,
                    city: body.address.city!,
                    district: body.address.district!,
                    street: body.address.street!,
                    number: body.address.number!,
                    zipCode: body.address.zipCode!,
                    complement: body.address.complement ?? "",
                  },
                },
              }
            : undefined,
          clientProfile: {
            upsert: {
              create: {},
              update: {},
            },
          },
        },
      });

      const profile = await tx.clientProfile.upsert({
        where: { userId: session.user.id },
        update: {},
        create: { userId: session.user.id },
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
          },
        },
      },
    });

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
          }
        : undefined,
      preferences: updatedUser!.clientProfile
        ?.preferences as ClientProfileData["preferences"],
      privacy: updatedUser!.clientProfile
        ?.privacy as ClientProfileData["privacy"],
      plan: updatedUser!.serviceProvider?.subscriptions[0].plan.name ?? "Start",
    };

    return NextResponse.json({ user: responseData });
  } catch (error) {
    console.error("[PUT /me]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
