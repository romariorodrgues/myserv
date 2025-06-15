/**
 * User registration API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles user registration for both clients and service providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { UserType } from '@/types'
import { isValidCPF, isValidCNPJ } from '@/utils'

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  userType: z.enum([UserType.CLIENT, UserType.SERVICE_PROVIDER]),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  acceptTerms: z.boolean().refine(val => val === true, 'Deve aceitar os termos')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = registerSchema.parse(body)
    
    // Validate CPF/CNPJ
    const cleanDocument = validatedData.cpfCnpj.replace(/\D/g, '')
    const isValidDocument = cleanDocument.length === 11 
      ? isValidCPF(cleanDocument) 
      : isValidCNPJ(cleanDocument)
    
    if (!isValidDocument) {
      return NextResponse.json(
        { error: 'CPF/CNPJ inválido' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { cpfCnpj: cleanDocument }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já cadastrado com este email ou CPF/CNPJ' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        cpfCnpj: cleanDocument,
        password: hashedPassword,
        userType: validatedData.userType,
        isApproved: validatedData.userType === UserType.CLIENT, // Auto-approve clients
      }
    })

    // Create specific profile based on user type
    if (validatedData.userType === UserType.CLIENT) {
      await prisma.clientProfile.create({
        data: {
          userId: user.id
        }
      })
    } else {
      await prisma.serviceProvider.create({
        data: {
          userId: user.id,
          hasScheduling: false,
          hasQuoting: true
        }
      })
    }

    // Return success response (exclude sensitive data)
    const { ...userWithoutSensitiveData } = user
    
    return NextResponse.json({
      success: true,
      message: validatedData.userType === UserType.CLIENT 
        ? 'Conta criada com sucesso! Você já pode fazer login.'
        : 'Cadastro realizado! Sua conta será analisada e aprovada em até 24 horas.',
      user: userWithoutSensitiveData
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  )
}
