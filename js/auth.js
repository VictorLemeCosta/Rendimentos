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

window.carregarAvatarMenu = async function carregarAvatarMenu() {
  const avatarContainer = document.getElementById("navProfileAvatar");

  if (!avatarContainer || !window.supabaseClient) {
    return;
  }

  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    renderizarAvatarPadraoMenu(avatarContainer);
    return;
  }

  const { data: profile, error: profileError } = await window.supabaseClient
    .from("profiles")
    .select("avatar_url, nome")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.avatar_url) {
    renderizarAvatarPadraoMenu(avatarContainer);
    return;
  }

  renderizarAvatarMenu(avatarContainer, profile.avatar_url);
};

function renderizarAvatarMenu(container, avatarUrl) {
  container.innerHTML = "";

  const presetMap = {
    "preset-tucano": "🦜",
    "preset-leao": "🦁",
    "preset-praia": "🏖️",
    "preset-montanha": "⛰️",
    "preset-foguete": "🚀"
  };

  if (avatarUrl.startsWith("preset:")) {
    const preset = avatarUrl.replace("preset:", "");
    const icon = presetMap[preset] || "👤";

    const presetAvatar = document.createElement("span");
    presetAvatar.className = `nav-preset-avatar ${preset}`;
    presetAvatar.textContent = icon;

    container.appendChild(presetAvatar);
    return;
  }

  const img = document.createElement("img");
  img.src = avatarUrl;
  img.alt = "Foto de perfil";

  img.onerror = function () {
    renderizarAvatarPadraoMenu(container);
  };

  container.appendChild(img);
}

function renderizarAvatarPadraoMenu(container) {
  container.innerHTML = "";

  const wrapper = document.createElement("span");
  wrapper.className = "nav-default-avatar";

  const head = document.createElement("span");
  head.className = "nav-default-avatar-head";

  const body = document.createElement("span");
  body.className = "nav-default-avatar-body";

  wrapper.appendChild(head);
  wrapper.appendChild(body);
  container.appendChild(wrapper);
}