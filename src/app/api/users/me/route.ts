import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  console.log('✅ Sessão recebida no /me:', session)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      userType: true,
      isApproved: true,
      profileImage: true,
      description: true,
      address: {
        select: {
          id: true,
          userId: true,
          state: true,
          city: true,
          district: true,
          street: true,
          number: true,
          zipCode: true,
          latitude: true,
          longitude: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      clientProfile: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          preferences: {
            select: {
              emailNotifications: true,
              smsNotifications: true,
              whatsappNotifications: true,
              marketingEmails: true,
              serviceReminders: true,
              reviewRequests: true,
            },
          },
          privacy: {
            select: {
              profileVisibility: true,
              showPhone: true,
              showEmail: true,
              showLocation: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        profileImage: body.profileImage,
        description: body.bio,
        address: body.address
          ? {
              upsert: {
                create: {
                  state: body.address.state,
                  city: body.address.city,
                  district: body.address.neighborhood,
                  street: body.address.street,
                  number: body.address.number,
                  zipCode: body.address.zipCode,
                },
                update: {
                  state: body.address.state,
                  city: body.address.city,
                  district: body.address.neighborhood,
                  street: body.address.street,
                  number: body.address.number,
                  zipCode: body.address.zipCode,
                },
              },
            }
          : undefined,
        clientProfile: body.preferences || body.privacy
          ? {
              upsert: {
                create: {
                  preferences: body.preferences
                    ? {
                        create: {
                          emailNotifications: body.preferences.emailNotifications,
                          smsNotifications: body.preferences.smsNotifications,
                          whatsappNotifications: body.preferences.whatsappNotifications,
                          marketingEmails: body.preferences.marketingEmails,
                          serviceReminders: body.preferences.serviceReminders,
                          reviewRequests: body.preferences.reviewRequests,
                        },
                      }
                    : undefined,
                  privacy: body.privacy
                    ? {
                        create: {
                          profileVisibility: body.privacy.profileVisibility,
                          showPhone: body.privacy.showPhone,
                          showEmail: body.privacy.showEmail,
                          showLocation: body.privacy.showLocation,
                        },
                      }
                    : undefined,
                },
                update: {
                  preferences: body.preferences
                    ? {
                        upsert: {
                          create: {
                            emailNotifications: body.preferences.emailNotifications,
                            smsNotifications: body.preferences.smsNotifications,
                            whatsappNotifications: body.preferences.whatsappNotifications,
                            marketingEmails: body.preferences.marketingEmails,
                            serviceReminders: body.preferences.serviceReminders,
                            reviewRequests: body.preferences.reviewRequests,
                          },
                          update: {
                            emailNotifications: body.preferences.emailNotifications,
                            smsNotifications: body.preferences.smsNotifications,
                            whatsappNotifications: body.preferences.whatsappNotifications,
                            marketingEmails: body.preferences.marketingEmails,
                            serviceReminders: body.preferences.serviceReminders,
                            reviewRequests: body.preferences.reviewRequests,
                          },
                        },
                      }
                    : undefined,
                  privacy: body.privacy
                    ? {
                        upsert: {
                          create: {
                            profileVisibility: body.privacy.profileVisibility,
                            showPhone: body.privacy.showPhone,
                            showEmail: body.privacy.showEmail,
                            showLocation: body.privacy.showLocation,
                          },
                          update: {
                            profileVisibility: body.privacy.profileVisibility,
                            showPhone: body.privacy.showPhone,
                            showEmail: body.privacy.showEmail,
                            showLocation: body.privacy.showLocation,
                          },
                        },
                      }
                    : undefined,
                },
              },
            }
          : undefined,
      },
      include: {
        address: true,
        clientProfile: {
          include: {
            preferences: true,
            privacy: true,
          },
        },
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('[PUT /me]', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
