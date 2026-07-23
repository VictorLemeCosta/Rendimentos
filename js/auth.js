async function verificarLogin() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}   