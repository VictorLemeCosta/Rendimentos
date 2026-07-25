let profileSettingsUser = null;
let profileSettingsProfile = {};
let profileSettingsFinancialProfile = {};

window.toggleCollapsibleSection = function toggleCollapsibleSection(sectionId) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  section.classList.toggle("collapsed");
};

async function carregarConfiguracoesPerfil() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  profileSettingsUser = user;

  await carregarProfilePerfil();
  await carregarFinancialProfilePerfil();

  preencherFormularioPerfil();
}

async function carregarProfilePerfil() {
  const { data, error } = await window.supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", profileSettingsUser.id)
    .single();

  if (error) {
    console.error("Erro ao carregar profiles:", error);
    profileSettingsProfile = {};
    return;
  }

  profileSettingsProfile = data || {};
}

async function carregarFinancialProfilePerfil() {
  const { data, error } = await window.supabaseClient
    .from("financial_profile")
    .select("*")
    .eq("user_id", profileSettingsUser.id)
    .single();

  if (error) {
    console.error("Erro ao carregar financial_profile:", error);
    profileSettingsFinancialProfile = {};
    return;
  }

  profileSettingsFinancialProfile = data || {};
}

function preencherFormularioPerfil() {

popularSelectPaisesPerfil();
  setValue("profileFullName", profileSettingsProfile.nome || "");
  setValue("profileEmail", profileSettingsUser.email || "");
  setValue("profileAvatarUrl", profileSettingsProfile.avatar_url || "");

  setValue("profilePhone", profileSettingsProfile.celular || "");
  setValue("profileCountry", profileSettingsProfile.pais || "Brasil");
setValue("profileCep", profileSettingsProfile.cep || "");
setValue("profileAddress", profileSettingsProfile.endereco || "");
setValue("profileNumber", profileSettingsProfile.numero || "");
setValue("profileComplement", profileSettingsProfile.complemento || "");
setValue("profileNeighborhood", profileSettingsProfile.bairro || "");
setValue("profileCity", profileSettingsProfile.cidade || "");
setValue("profileState", profileSettingsProfile.estado || "");
setValue("profileCompany", profileSettingsProfile.empresa || "");
setValue("profileBusinessSector", profileSettingsProfile.ramo_empresa || "");
setValue("profileJobTitle", profileSettingsProfile.cargo || "");
setValue("profileType", profileSettingsProfile.tipo_perfil || "pessoal");

  setValue("profileThemeMode", profileSettingsProfile.theme_mode || "light");
  setValue("profileColorPalette", profileSettingsProfile.color_palette || "financehub");

  setValue("profileJornadaTipo", profileSettingsFinancialProfile.jornada_tipo || "SEG_SEX");
  setValue("profileHoraInicio", normalizarHoraPerfil(profileSettingsFinancialProfile.hora_inicio || "09:00"));
  setValue("profileHoraFim", normalizarHoraPerfil(profileSettingsFinancialProfile.hora_fim || "18:00"));
  setValue("profileFolgaSemanal", profileSettingsFinancialProfile.folga_semanal ?? 0);
  setValue("profileDataReferencia12x36", profileSettingsFinancialProfile.data_referencia_12x36 || "");
  setValue("profileTurno12x36", profileSettingsFinancialProfile.turno_12x36 || "DIURNO");

  preencherAvatarPreview();
  alternarCamposJornadaPerfil();
}

function setValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function normalizarHoraPerfil(hora) {
  if (!hora) {
    return "";
  }

  return String(hora).slice(0, 5);
}

function preencherAvatarPreview() {
  const avatarPreview = document.getElementById("profileAvatarPreview");
  const avatarUrl = document.getElementById("profileAvatarUrl")?.value || "";

  if (!avatarPreview) {
    return;
  }

  avatarPreview.innerHTML = "";

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

    const presetDiv = document.createElement("div");
    presetDiv.className = `preset-avatar-preview ${preset}`;

    const span = document.createElement("span");
    span.textContent = icon;

    presetDiv.appendChild(span);
    avatarPreview.appendChild(presetDiv);

    return;
  }

  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = "Foto de perfil";

    img.onerror = function () {
      renderDefaultAvatar();
    };

    avatarPreview.appendChild(img);
    return;
  }

  renderDefaultAvatar();
}

function renderDefaultAvatar() {
  const avatarPreview = document.getElementById("profileAvatarPreview");

  if (!avatarPreview) {
    return;
  }

  avatarPreview.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "default-avatar-icon";

  const head = document.createElement("div");
  head.className = "default-avatar-head";

  const body = document.createElement("div");
  body.className = "default-avatar-body";

  wrapper.appendChild(head);
  wrapper.appendChild(body);

  avatarPreview.appendChild(wrapper);
}

window.togglePredefinedAvatars = function togglePredefinedAvatars() {
  const grid = document.getElementById("predefinedAvatarGrid");

  if (!grid) {
    return;
  }

  grid.classList.toggle("hidden");
};

window.escolherAvatarPredefinido = function escolherAvatarPredefinido(presetClass) {
  const avatarInput = document.getElementById("profileAvatarUrl");

  if (avatarInput) {
    avatarInput.value = `preset:${presetClass}`;
  }

  window.fecharGaleriaAvatares();
  preencherAvatarPreview();
};

window.removerAvatarPerfil = function removerAvatarPerfil() {
  const avatarInput = document.getElementById("profileAvatarUrl");
  const uploadInput = document.getElementById("profileAvatarUpload");

  if (avatarInput) {
    avatarInput.value = "";
  }

  if (uploadInput) {
    uploadInput.value = "";
  }

  preencherAvatarPreview();
};

window.handleAvatarUpload = async function handleAvatarUpload(input) {
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!profileSettingsUser) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  window.fecharGaleriaAvatares();

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    alert("Use uma imagem JPG, PNG ou WEBP.");
    input.value = "";
    return;
  }

  const maxSizeMb = 5;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    alert(`A imagem deve ter no máximo ${maxSizeMb}MB.`);
    input.value = "";
    return;
  }

  const fileExtension = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExtension}`;
  const filePath = `${profileSettingsUser.id}/${fileName}`;

  const { error: uploadError } = await window.supabaseClient.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true
    });

  if (uploadError) {
    console.error("Erro ao fazer upload da foto:", uploadError);
    alert("Erro ao fazer upload da foto: " + uploadError.message);
    return;
  }

  const { data } = window.supabaseClient.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  const avatarInput = document.getElementById("profileAvatarUrl");

  if (avatarInput) {
    avatarInput.value = publicUrl;
  }

  const { error: profileError } = await window.supabaseClient
    .from("profiles")
    .update({
      avatar_url: publicUrl
    })
    .eq("id", profileSettingsUser.id);

  if (profileError) {
    console.error("Erro ao salvar URL da foto no perfil:", profileError);
    alert("Upload realizado, mas erro ao salvar foto no perfil: " + profileError.message);
    return;
  }

  preencherAvatarPreview();
};

window.alternarCamposJornadaPerfil = function alternarCamposJornadaPerfil() {
  const tipo = document.getElementById("profileJornadaTipo")?.value || "SEG_SEX";

  const folgaBox = document.getElementById("profileFolga6x1Box");
  const referenciaBox = document.getElementById("profileReferencia12x36Box");
  const turnoBox = document.getElementById("profileTurno12x36Box");

  if (folgaBox) {
    folgaBox.classList.toggle("hidden", tipo !== "6X1");
  }

  if (referenciaBox) {
    referenciaBox.classList.toggle("hidden", tipo !== "12X36");
  }

  if (turnoBox) {
    turnoBox.classList.toggle("hidden", tipo !== "12X36");
  }
};

window.salvarDadosPessoaisPerfil = async function salvarDadosPessoaisPerfil() {
  const nome = document.getElementById("profileFullName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const avatarUrl = document.getElementById("profileAvatarUrl").value.trim();

  if (!nome || !email) {
    alert("Preencha nome e e-mail.");
    return;
  }

  const { error: profileError } = await window.supabaseClient
    .from("profiles")
    .update({
  nome: nome,
  avatar_url: avatarUrl,

  celular: document.getElementById("profilePhone")?.value.trim() || null,
  pais: document.getElementById("profileCountry")?.value || null,
  cep: document.getElementById("profileCep")?.value.trim() || null,
  endereco: document.getElementById("profileAddress")?.value.trim() || null,
  numero: document.getElementById("profileNumber")?.value.trim() || null,
  complemento: document.getElementById("profileComplement")?.value.trim() || null,
  bairro: document.getElementById("profileNeighborhood")?.value.trim() || null,
  cidade: document.getElementById("profileCity")?.value.trim() || null,
  estado: document.getElementById("profileState")?.value.trim() || null,
  empresa: document.getElementById("profileCompany")?.value.trim() || null,
  ramo_empresa: document.getElementById("profileBusinessSector")?.value || null,
  cargo: document.getElementById("profileJobTitle")?.value.trim() || null,
  tipo_perfil: document.getElementById("profileType")?.value || "pessoal"
})
    .eq("id", profileSettingsUser.id);

  if (profileError) {
    console.error("Erro ao salvar perfil:", profileError);
    alert("Erro ao salvar perfil: " + profileError.message);
    return;
  }

  if (email !== profileSettingsUser.email) {
    const { error: emailError } = await window.supabaseClient.auth.updateUser({
      email: email
    });

    if (emailError) {
      console.error("Erro ao atualizar e-mail:", emailError);
      alert("Dados salvos, mas houve erro ao alterar e-mail: " + emailError.message);
      return;
    }

    alert("Dados salvos. Confirme o novo e-mail, se o Supabase solicitar confirmação.");
    return;
  }

  preencherAvatarPreview();

  alert("Dados pessoais salvos com sucesso.");
};

window.alterarSenhaPerfil = async function alterarSenhaPerfil() {
  const senha = document.getElementById("newPasswordInput").value;
  const confirmarSenha = document.getElementById("confirmNewPasswordInput").value;

  if (!senha || !confirmarSenha) {
    alert("Preencha a nova senha e a confirmação.");
    return;
  }

  if (senha !== confirmarSenha) {
    alert("As senhas não conferem.");
    return;
  }

  const { error } = await window.supabaseClient.auth.updateUser({
    password: senha
  });

  if (error) {
    console.error("Erro ao alterar senha:", error);
    alert("Erro ao alterar senha: " + error.message);
    return;
  }

  document.getElementById("newPasswordInput").value = "";
  document.getElementById("confirmNewPasswordInput").value = "";

  alert("Senha alterada com sucesso.");
};

window.salvarJornadaPerfil = async function salvarJornadaPerfil() {
  const tipo = document.getElementById("profileJornadaTipo").value;

  const payload = {
    jornada_tipo: tipo,
    hora_inicio: document.getElementById("profileHoraInicio").value || "09:00",
    hora_fim: document.getElementById("profileHoraFim").value || "18:00",
    folga_semanal: tipo === "6X1"
      ? Number(document.getElementById("profileFolgaSemanal").value || 0)
      : null,
    data_referencia_12x36: tipo === "12X36"
      ? document.getElementById("profileDataReferencia12x36").value || null
      : null,
    turno_12x36: tipo === "12X36"
      ? document.getElementById("profileTurno12x36").value || "DIURNO"
      : null,
    atualizado_em: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from("financial_profile")
    .update(payload)
    .eq("user_id", profileSettingsUser.id);

  if (error) {
    console.error("Erro ao salvar jornada:", error);
    alert("Erro ao salvar jornada: " + error.message);
    return;
  }

  alert("Jornada salva com sucesso.");
};

window.salvarTemaPerfil = async function salvarTemaPerfil() {
  const themeMode = document.getElementById("profileThemeMode").value;
  const colorPalette = document.getElementById("profileColorPalette").value;

  const { error } = await window.supabaseClient
    .from("profiles")
    .update({
      theme_mode: themeMode,
      color_palette: colorPalette
    })
    .eq("id", profileSettingsUser.id);

  if (error) {
    console.error("Erro ao salvar tema:", error);
    alert("Erro ao salvar aparência: " + error.message);
    return;
  }

  alert("Aparência salva com sucesso. A aplicação visual do tema será implementada na próxima etapa.");
};

window.fecharGaleriaAvatares = function fecharGaleriaAvatares() {
  const grid = document.getElementById("predefinedAvatarGrid");

  if (grid) {
    grid.classList.add("hidden");
  }
};

const countriesWithFlags = [
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Uruguai", flag: "🇺🇾" },
  { name: "Paraguai", flag: "🇵🇾" },
  { name: "Bolívia", flag: "🇧🇴" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Colômbia", flag: "🇨🇴" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Equador", flag: "🇪🇨" },
  { name: "México", flag: "🇲🇽" },
  { name: "Estados Unidos", flag: "🇺🇸" },
  { name: "Canadá", flag: "🇨🇦" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Espanha", flag: "🇪🇸" },
  { name: "França", flag: "🇫🇷" },
  { name: "Alemanha", flag: "🇩🇪" },
  { name: "Itália", flag: "🇮🇹" },
  { name: "Reino Unido", flag: "🇬🇧" },
  { name: "Irlanda", flag: "🇮🇪" },
  { name: "Países Baixos", flag: "🇳🇱" },
  { name: "Suíça", flag: "🇨🇭" },
  { name: "Austrália", flag: "🇦🇺" },
  { name: "Nova Zelândia", flag: "🇳🇿" },
  { name: "Japão", flag: "🇯🇵" },
  { name: "China", flag: "🇨🇳" },
  { name: "Coreia do Sul", flag: "🇰🇷" },
  { name: "Índia", flag: "🇮🇳" },
  { name: "África do Sul", flag: "🇿🇦" },
  { name: "Outro", flag: "🌎" }
];

function popularSelectPaisesPerfil() {
  const select = document.getElementById("profileCountry");

  if (!select) {
    return;
  }

  const paisSelecionado = select.value;

  select.innerHTML = `<option value="">Selecione o país</option>`;

  countriesWithFlags.forEach((country) => {
    const option = document.createElement("option");

    option.value = country.name;
    option.textContent = `${country.flag} ${country.name}`;

    select.appendChild(option);
  });

  if (paisSelecionado) {
    select.value = paisSelecionado;
  }
}