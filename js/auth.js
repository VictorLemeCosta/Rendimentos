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

window.logout = async function logout() {
  const { error } = await window.supabaseClient.auth.signOut();

  if (error) {
    console.error("Erro ao sair:", error);
    alert("Erro ao sair da conta: " + error.message);
    return;
  }

  window.location.href = "login.html";
};