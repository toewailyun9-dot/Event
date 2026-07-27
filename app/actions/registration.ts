'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'


export async function createRegistration(data: {
  name: string
  email: string
  age: number
  phone: string
  address: string
}) {
  try {
    const newRegistration = await prisma.registration.create({
      data: {
        name: data.name,
        email: data.email,
        age: Number(data.age),
        phone: data.phone,
        address: data.address,
      },
    })

    // Admin dashboard ဘက်မှာ Data အသစ်ချက်ချင်း ပေါ်လာအောင် Cache ရှင်းပေးခြင်း
    revalidatePath('/admin/registrations')

    return { success: true, data: newRegistration }
  } catch (error) {
    console.error('Registration Error:', error)
    return { success: false, error: 'Registration ပြုလုပ်ခြင်း မအောင်မြင်ပါ။' }
  }
}