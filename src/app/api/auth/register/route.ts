import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password, full_name } = await request.json()
    
    // Create a Supabase client with service role
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookies().set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookies().set({ name, value: '', ...options })
          },
        },
      }
    )

    // Create the user in auth.users
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError) throw signUpError

    if (authUser.user) {
      // Create the user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          full_name,
          role: 'admin',
          active: true
        })

      if (profileError) throw profileError
    }

    return NextResponse.json({ message: 'Admin user created successfully' })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
