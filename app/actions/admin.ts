'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ၁။ Registrations အားလုံးကို ယူသည့် Action
export async function getRegistrations() {
  try {
    const data = await prisma.registration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return { success: true, data }
  } catch (error) {
    console.error('Failed to fetch registrations:', error)
    return { success: false, error: 'Data များ ဆွဲထုတ်၍ မရပါ။' }
  }
}

// ၂။ Registration တစ်ခုကို ဖျက်သည့် Action
export async function deleteRegistration(id: string) {
  try {
    await prisma.registration.delete({
      where: { id },
    })
    revalidatePath('/admin') 
    return { success: true }
  } catch (error) {
    console.error('Failed to delete registration:', error)
    return { success: false, error: 'ဖျက်ထုတ်ခြင်း မအောင်မြင်ပါ။' }
  }
}