const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  console.log("Intentando login con:", email, password)
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log("Respuesta de login:", error)
    if (error) throw error
    // ...
  } catch (error: any) {
    console.error("Error en login:", error)
    // ...
  } finally {
    setIsLoading(false)
  }
} 