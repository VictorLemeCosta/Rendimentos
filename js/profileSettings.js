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
popularPhoneDdiDropdown();
  setValue("profileFullName", profileSettingsProfile.nome || "");
  setValue("profileEmail", profileSettingsUser.email || "");
  setValue("profileAvatarUrl", profileSettingsProfile.avatar_url || "");

  setValue("profilePhoneDdi", profileSettingsProfile.celular_ddi || "+55");
  atualizarPhoneDdiSelecionado(profileSettingsProfile.celular_ddi || "+55");
  setValue("profilePhoneNumber", profileSettingsProfile.celular_numero || profileSettingsProfile.celular || "");
  setValue("profileCountry", profileSettingsProfile.pais || "Brasil");
  atualizarPaisSelecionadoPerfil(profileSettingsProfile.pais || "Brasil");
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

window.escolherAvatarPredefinido = async function escolherAvatarPredefinido(presetClass) {
  const avatarInput = document.getElementById("profileAvatarUrl");
  const avatarValue = `preset:${presetClass}`;

  if (avatarInput) {
    avatarInput.value = avatarValue;
  }

  window.fecharGaleriaAvatares();
  preencherAvatarPreview();

  if (!profileSettingsUser) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const { error } = await window.supabaseClient
    .from("profiles")
    .update({
      avatar_url: avatarValue
    })
    .eq("id", profileSettingsUser.id);

  if (error) {
    console.error("Erro ao salvar avatar predefinido:", error);
    alert("Erro ao salvar avatar: " + error.message);
    return;
  }

  if (window.carregarAvatarMenu) {
    await window.carregarAvatarMenu();
  }
};

window.removerAvatarPerfil = async function removerAvatarPerfil() {
  const avatarInput = document.getElementById("profileAvatarUrl");
  const uploadInput = document.getElementById("profileAvatarUpload");

  if (avatarInput) {
    avatarInput.value = "";
  }

  if (uploadInput) {
    uploadInput.value = "";
  }

  preencherAvatarPreview();

  if (!profileSettingsUser) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const { error } = await window.supabaseClient
    .from("profiles")
    .update({
      avatar_url: null
    })
    .eq("id", profileSettingsUser.id);

  if (error) {
    console.error("Erro ao remover avatar:", error);
    alert("Erro ao remover avatar: " + error.message);
    return;
  }

  if (window.carregarAvatarMenu) {
    await window.carregarAvatarMenu();
  }
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
  if (window.carregarAvatarMenu) {
  window.carregarAvatarMenu();
}
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

  celular_ddi: document.getElementById("profilePhoneDdi")?.value || "+55",
  celular_numero: document.getElementById("profilePhoneNumber")?.value.trim() || null,
  celular: `${document.getElementById("profilePhoneDdi")?.value || "+55"} ${document.getElementById("profilePhoneNumber")?.value.trim() || ""}`.trim(),
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

const countryDirectory = [
  { name: "Afeganistão", code: "af", ddi: "+93" },
  { name: "África do Sul", code: "za", ddi: "+27" },
  { name: "Albânia", code: "al", ddi: "+355" },
  { name: "Alemanha", code: "de", ddi: "+49" },
  { name: "Andorra", code: "ad", ddi: "+376" },
  { name: "Angola", code: "ao", ddi: "+244" },
  { name: "Anguilla", code: "ai", ddi: "+1 264" },
  { name: "Antígua e Barbuda", code: "ag", ddi: "+1 268" },
  { name: "Arábia Saudita", code: "sa", ddi: "+966" },
  { name: "Argélia", code: "dz", ddi: "+213" },
  { name: "Argentina", code: "ar", ddi: "+54" },
  { name: "Armênia", code: "am", ddi: "+374" },
  { name: "Aruba", code: "aw", ddi: "+297" },
  { name: "Austrália", code: "au", ddi: "+61" },
  { name: "Áustria", code: "at", ddi: "+43" },
  { name: "Azerbaijão", code: "az", ddi: "+994" },

  { name: "Bahamas", code: "bs", ddi: "+1 242" },
  { name: "Bahrein", code: "bh", ddi: "+973" },
  { name: "Bangladesh", code: "bd", ddi: "+880" },
  { name: "Barbados", code: "bb", ddi: "+1 246" },
  { name: "Bélgica", code: "be", ddi: "+32" },
  { name: "Belize", code: "bz", ddi: "+501" },
  { name: "Benin", code: "bj", ddi: "+229" },
  { name: "Bermudas", code: "bm", ddi: "+1 441" },
  { name: "Bielorrússia", code: "by", ddi: "+375" },
  { name: "Bolívia", code: "bo", ddi: "+591" },
  { name: "Bósnia e Herzegovina", code: "ba", ddi: "+387" },
  { name: "Botswana", code: "bw", ddi: "+267" },
  { name: "Brasil", code: "br", ddi: "+55" },
  { name: "Brunei", code: "bn", ddi: "+673" },
  { name: "Bulgária", code: "bg", ddi: "+359" },
  { name: "Burkina Faso", code: "bf", ddi: "+226" },
  { name: "Burundi", code: "bi", ddi: "+257" },
  { name: "Butão", code: "bt", ddi: "+975" },

  { name: "Cabo Verde", code: "cv", ddi: "+238" },
  { name: "Camarões", code: "cm", ddi: "+237" },
  { name: "Camboja", code: "kh", ddi: "+855" },
  { name: "Canadá", code: "ca", ddi: "+1" },
  { name: "Catar", code: "qa", ddi: "+974" },
  { name: "Cazaquistão", code: "kz", ddi: "+7" },
  { name: "Chade", code: "td", ddi: "+235" },
  { name: "Chile", code: "cl", ddi: "+56" },
  { name: "China", code: "cn", ddi: "+86" },
  { name: "Chipre", code: "cy", ddi: "+357" },
  { name: "Colômbia", code: "co", ddi: "+57" },
  { name: "Comores", code: "km", ddi: "+269" },
  { name: "Congo", code: "cg", ddi: "+242" },
  { name: "Coreia do Norte", code: "kp", ddi: "+850" },
  { name: "Coreia do Sul", code: "kr", ddi: "+82" },
  { name: "Costa do Marfim", code: "ci", ddi: "+225" },
  { name: "Costa Rica", code: "cr", ddi: "+506" },
  { name: "Croácia", code: "hr", ddi: "+385" },
  { name: "Cuba", code: "cu", ddi: "+53" },
  { name: "Curaçao", code: "cw", ddi: "+599" },

  { name: "Dinamarca", code: "dk", ddi: "+45" },
  { name: "Djibouti", code: "dj", ddi: "+253" },
  { name: "Dominica", code: "dm", ddi: "+1 767" },

  { name: "Egito", code: "eg", ddi: "+20" },
  { name: "El Salvador", code: "sv", ddi: "+503" },
  { name: "Emirados Árabes Unidos", code: "ae", ddi: "+971" },
  { name: "Equador", code: "ec", ddi: "+593" },
  { name: "Eritreia", code: "er", ddi: "+291" },
  { name: "Escócia", code: "gb", ddi: "+44" },
  { name: "Eslováquia", code: "sk", ddi: "+421" },
  { name: "Eslovênia", code: "si", ddi: "+386" },
  { name: "Espanha", code: "es", ddi: "+34" },
  { name: "Estados Unidos", code: "us", ddi: "+1" },
  { name: "Estônia", code: "ee", ddi: "+372" },
  { name: "Eswatini", code: "sz", ddi: "+268" },
  { name: "Etiópia", code: "et", ddi: "+251" },

  { name: "Fiji", code: "fj", ddi: "+679" },
  { name: "Filipinas", code: "ph", ddi: "+63" },
  { name: "Finlândia", code: "fi", ddi: "+358" },
  { name: "França", code: "fr", ddi: "+33" },

  { name: "Gabão", code: "ga", ddi: "+241" },
  { name: "Gâmbia", code: "gm", ddi: "+220" },
  { name: "Gana", code: "gh", ddi: "+233" },
  { name: "Geórgia", code: "ge", ddi: "+995" },
  { name: "Gibraltar", code: "gi", ddi: "+350" },
  { name: "Granada", code: "gd", ddi: "+1 473" },
  { name: "Grécia", code: "gr", ddi: "+30" },
  { name: "Groenlândia", code: "gl", ddi: "+299" },
  { name: "Guadalupe", code: "gp", ddi: "+590" },
  { name: "Guam", code: "gu", ddi: "+1 671" },
  { name: "Guatemala", code: "gt", ddi: "+502" },
  { name: "Guernsey", code: "gg", ddi: "+44" },
  { name: "Guiana", code: "gy", ddi: "+592" },
  { name: "Guiana Francesa", code: "gf", ddi: "+594" },
  { name: "Guiné", code: "gn", ddi: "+224" },
  { name: "Guiné-Bissau", code: "gw", ddi: "+245" },
  { name: "Guiné Equatorial", code: "gq", ddi: "+240" },

  { name: "Haiti", code: "ht", ddi: "+509" },
  { name: "Honduras", code: "hn", ddi: "+504" },
  { name: "Hong Kong", code: "hk", ddi: "+852" },
  { name: "Hungria", code: "hu", ddi: "+36" },

  { name: "Iêmen", code: "ye", ddi: "+967" },
  { name: "Ilha de Man", code: "im", ddi: "+44" },
  { name: "Ilhas Cayman", code: "ky", ddi: "+1 345" },
  { name: "Ilhas Cook", code: "ck", ddi: "+682" },
  { name: "Ilhas Faroe", code: "fo", ddi: "+298" },
  { name: "Ilhas Malvinas", code: "fk", ddi: "+500" },
  { name: "Ilhas Marshall", code: "mh", ddi: "+692" },
  { name: "Ilhas Salomão", code: "sb", ddi: "+677" },
  { name: "Ilhas Virgens Britânicas", code: "vg", ddi: "+1 284" },
  { name: "Ilhas Virgens Americanas", code: "vi", ddi: "+1 340" },
  { name: "Índia", code: "in", ddi: "+91" },
  { name: "Indonésia", code: "id", ddi: "+62" },
  { name: "Irã", code: "ir", ddi: "+98" },
  { name: "Iraque", code: "iq", ddi: "+964" },
  { name: "Irlanda", code: "ie", ddi: "+353" },
  { name: "Islândia", code: "is", ddi: "+354" },
  { name: "Israel", code: "il", ddi: "+972" },
  { name: "Itália", code: "it", ddi: "+39" },

  { name: "Jamaica", code: "jm", ddi: "+1 876" },
  { name: "Japão", code: "jp", ddi: "+81" },
  { name: "Jersey", code: "je", ddi: "+44" },
  { name: "Jordânia", code: "jo", ddi: "+962" },

  { name: "Kiribati", code: "ki", ddi: "+686" },
  { name: "Kosovo", code: "xk", ddi: "+383" },
  { name: "Kuwait", code: "kw", ddi: "+965" },

  { name: "Laos", code: "la", ddi: "+856" },
  { name: "Lesoto", code: "ls", ddi: "+266" },
  { name: "Letônia", code: "lv", ddi: "+371" },
  { name: "Líbano", code: "lb", ddi: "+961" },
  { name: "Libéria", code: "lr", ddi: "+231" },
  { name: "Líbia", code: "ly", ddi: "+218" },
  { name: "Liechtenstein", code: "li", ddi: "+423" },
  { name: "Lituânia", code: "lt", ddi: "+370" },
  { name: "Luxemburgo", code: "lu", ddi: "+352" },

  { name: "Macau", code: "mo", ddi: "+853" },
  { name: "Macedônia do Norte", code: "mk", ddi: "+389" },
  { name: "Madagascar", code: "mg", ddi: "+261" },
  { name: "Malásia", code: "my", ddi: "+60" },
  { name: "Malawi", code: "mw", ddi: "+265" },
  { name: "Maldivas", code: "mv", ddi: "+960" },
  { name: "Mali", code: "ml", ddi: "+223" },
  { name: "Malta", code: "mt", ddi: "+356" },
  { name: "Marrocos", code: "ma", ddi: "+212" },
  { name: "Martinica", code: "mq", ddi: "+596" },
  { name: "Maurício", code: "mu", ddi: "+230" },
  { name: "Mauritânia", code: "mr", ddi: "+222" },
  { name: "Mayotte", code: "yt", ddi: "+262" },
  { name: "México", code: "mx", ddi: "+52" },
  { name: "Micronésia", code: "fm", ddi: "+691" },
  { name: "Moçambique", code: "mz", ddi: "+258" },
  { name: "Moldávia", code: "md", ddi: "+373" },
  { name: "Mônaco", code: "mc", ddi: "+377" },
  { name: "Mongólia", code: "mn", ddi: "+976" },
  { name: "Montenegro", code: "me", ddi: "+382" },
  { name: "Montserrat", code: "ms", ddi: "+1 664" },
  { name: "Myanmar", code: "mm", ddi: "+95" },

  { name: "Namíbia", code: "na", ddi: "+264" },
  { name: "Nauru", code: "nr", ddi: "+674" },
  { name: "Nepal", code: "np", ddi: "+977" },
  { name: "Nicarágua", code: "ni", ddi: "+505" },
  { name: "Níger", code: "ne", ddi: "+227" },
  { name: "Nigéria", code: "ng", ddi: "+234" },
  { name: "Niue", code: "nu", ddi: "+683" },
  { name: "Noruega", code: "no", ddi: "+47" },
  { name: "Nova Caledônia", code: "nc", ddi: "+687" },
  { name: "Nova Zelândia", code: "nz", ddi: "+64" },

  { name: "Omã", code: "om", ddi: "+968" },

  { name: "País de Gales", code: "gb", ddi: "+44" },
  { name: "Países Baixos", code: "nl", ddi: "+31" },
  { name: "Palau", code: "pw", ddi: "+680" },
  { name: "Palestina", code: "ps", ddi: "+970" },
  { name: "Panamá", code: "pa", ddi: "+507" },
  { name: "Papua-Nova Guiné", code: "pg", ddi: "+675" },
  { name: "Paquistão", code: "pk", ddi: "+92" },
  { name: "Paraguai", code: "py", ddi: "+595" },
  { name: "Peru", code: "pe", ddi: "+51" },
  { name: "Polinésia Francesa", code: "pf", ddi: "+689" },
  { name: "Polônia", code: "pl", ddi: "+48" },
  { name: "Porto Rico", code: "pr", ddi: "+1 787" },
  { name: "Portugal", code: "pt", ddi: "+351" },

  { name: "Quênia", code: "ke", ddi: "+254" },
  { name: "Quirguistão", code: "kg", ddi: "+996" },

  { name: "Reino Unido", code: "gb", ddi: "+44" },
  { name: "República Centro-Africana", code: "cf", ddi: "+236" },
  { name: "República Democrática do Congo", code: "cd", ddi: "+243" },
  { name: "República Dominicana", code: "do", ddi: "+1 809" },
  { name: "República Tcheca", code: "cz", ddi: "+420" },
  { name: "Reunião", code: "re", ddi: "+262" },
  { name: "Romênia", code: "ro", ddi: "+40" },
  { name: "Ruanda", code: "rw", ddi: "+250" },
  { name: "Rússia", code: "ru", ddi: "+7" },

  { name: "Saara Ocidental", code: "eh", ddi: "+212" },
  { name: "Saint Barthélemy", code: "bl", ddi: "+590" },
  { name: "Saint Martin", code: "mf", ddi: "+590" },
  { name: "Saint Pierre e Miquelon", code: "pm", ddi: "+508" },
  { name: "Samoa", code: "ws", ddi: "+685" },
  { name: "Samoa Americana", code: "as", ddi: "+1 684" },
  { name: "San Marino", code: "sm", ddi: "+378" },
  { name: "Santa Helena", code: "sh", ddi: "+290" },
  { name: "Santa Lúcia", code: "lc", ddi: "+1 758" },
  { name: "São Cristóvão e Nevis", code: "kn", ddi: "+1 869" },
  { name: "São Tomé e Príncipe", code: "st", ddi: "+239" },
  { name: "São Vicente e Granadinas", code: "vc", ddi: "+1 784" },
  { name: "Seicheles", code: "sc", ddi: "+248" },
  { name: "Senegal", code: "sn", ddi: "+221" },
  { name: "Serra Leoa", code: "sl", ddi: "+232" },
  { name: "Sérvia", code: "rs", ddi: "+381" },
  { name: "Singapura", code: "sg", ddi: "+65" },
  { name: "Sint Maarten", code: "sx", ddi: "+1 721" },
  { name: "Síria", code: "sy", ddi: "+963" },
  { name: "Somália", code: "so", ddi: "+252" },
  { name: "Sri Lanka", code: "lk", ddi: "+94" },
  { name: "Sudão", code: "sd", ddi: "+249" },
  { name: "Sudão do Sul", code: "ss", ddi: "+211" },
  { name: "Suécia", code: "se", ddi: "+46" },
  { name: "Suíça", code: "ch", ddi: "+41" },
  { name: "Suriname", code: "sr", ddi: "+597" },

  { name: "Tailândia", code: "th", ddi: "+66" },
  { name: "Taiwan", code: "tw", ddi: "+886" },
  { name: "Tajiquistão", code: "tj", ddi: "+992" },
  { name: "Tanzânia", code: "tz", ddi: "+255" },
  { name: "Timor-Leste", code: "tl", ddi: "+670" },
  { name: "Togo", code: "tg", ddi: "+228" },
  { name: "Tonga", code: "to", ddi: "+676" },
  { name: "Trinidad e Tobago", code: "tt", ddi: "+1 868" },
  { name: "Tunísia", code: "tn", ddi: "+216" },
  { name: "Turcomenistão", code: "tm", ddi: "+993" },
  { name: "Turquia", code: "tr", ddi: "+90" },
  { name: "Tuvalu", code: "tv", ddi: "+688" },

  { name: "Ucrânia", code: "ua", ddi: "+380" },
  { name: "Uganda", code: "ug", ddi: "+256" },
  { name: "Uruguai", code: "uy", ddi: "+598" },
  { name: "Uzbequistão", code: "uz", ddi: "+998" },

  { name: "Vanuatu", code: "vu", ddi: "+678" },
  { name: "Vaticano", code: "va", ddi: "+379" },
  { name: "Venezuela", code: "ve", ddi: "+58" },
  { name: "Vietnã", code: "vn", ddi: "+84" },

  { name: "Wallis e Futuna", code: "wf", ddi: "+681" },

  { name: "Zâmbia", code: "zm", ddi: "+260" },
  { name: "Zimbábue", code: "zw", ddi: "+263" },

  { name: "Outro", code: "world", ddi: "" }
];

const countriesWithFlags = [...countryDirectory]
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  .map((item) => ({
    name: item.name,
    code: item.code
  }));

const phoneDdiOptions = [...countryDirectory]
  .filter((item) => item.ddi)
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  .map((item) => ({
    country: item.name,
    ddi: item.ddi,
    code: item.code
  }));

function criarImagemBandeira(code, altText, className) {
  if (code === "world") {
    const span = document.createElement("span");
    span.className = "country-world-icon";
    span.textContent = "🌎";
    return span;
  }

  const img = document.createElement("img");
  img.className = className;
  img.src = `https://flagcdn.com/w40/${code}.png`;
  img.alt = altText;
  img.loading = "lazy";

  return img;
}

function popularSelectPaisesPerfil() {
  const dropdown = document.getElementById("countryDropdown");

  if (!dropdown) {
    return;
  }

  dropdown.innerHTML = "";

  countriesWithFlags.forEach((country) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "country-option";

    const flagWrapper = document.createElement("span");
    flagWrapper.className = "country-flag";
    flagWrapper.appendChild(
      criarImagemBandeira(country.code, `Bandeira de ${country.name}`, "country-flag-img")
    );

    const text = document.createElement("span");
    text.textContent = country.name;

    option.appendChild(flagWrapper);
    option.appendChild(text);

    option.onclick = function () {
      selecionarPaisPerfil(country.name);
    };

    dropdown.appendChild(option);
  });
}

window.toggleCountryDropdown = function toggleCountryDropdown() {
  const dropdown = document.getElementById("countryDropdown");

  if (!dropdown) {
    return;
  }

  dropdown.classList.toggle("hidden");
};

window.selecionarPaisPerfil = function selecionarPaisPerfil(countryName) {
  const input = document.getElementById("profileCountry");

  if (input) {
    input.value = countryName;
  }

  atualizarPaisSelecionadoPerfil(countryName);
  fecharDropdownPais();
};

function atualizarPaisSelecionadoPerfil(countryName) {
  const selectedFlag = document.getElementById("selectedCountryFlag");
  const selectedText = document.getElementById("selectedCountryText");

  if (!selectedFlag || !selectedText) {
    return;
  }

  selectedFlag.innerHTML = "";

  const country = countriesWithFlags.find((item) => item.name === countryName);

  if (!country) {
    selectedText.textContent = "Selecione o país";
    return;
  }

  selectedFlag.appendChild(
    criarImagemBandeira(country.code, `Bandeira de ${country.name}`, "country-flag-img")
  );

  selectedText.textContent = country.name;
}

function fecharDropdownPais() {
  const dropdown = document.getElementById("countryDropdown");

  if (dropdown) {
    dropdown.classList.add("hidden");
  }
}

function popularPhoneDdiDropdown() {
  const dropdown = document.getElementById("phoneDdiDropdown");

  if (!dropdown) {
    return;
  }

  dropdown.innerHTML = "";

  phoneDdiOptions.forEach((item) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "phone-ddi-option";

    const flagWrapper = document.createElement("span");
    flagWrapper.className = "phone-ddi-option-flag";

    flagWrapper.appendChild(
      criarImagemBandeira(item.code, `Bandeira de ${item.country}`, "phone-ddi-flag-img")
    );

    const countryCode = document.createElement("span");
    countryCode.className = "phone-ddi-country-code";
    countryCode.textContent = item.code.toUpperCase();

    const ddiText = document.createElement("span");
    ddiText.className = "phone-ddi-option-text";
    ddiText.textContent = item.ddi;

    option.appendChild(flagWrapper);
    option.appendChild(countryCode);
    option.appendChild(ddiText);

    option.onclick = function () {
      selecionarPhoneDdi(item.ddi);
    };

    dropdown.appendChild(option);
  });
}

window.togglePhoneDdiDropdown = function togglePhoneDdiDropdown() {
  const dropdown = document.getElementById("phoneDdiDropdown");

  if (!dropdown) {
    return;
  }

  dropdown.classList.toggle("hidden");
};

window.selecionarPhoneDdi = function selecionarPhoneDdi(ddi) {
  const input = document.getElementById("profilePhoneDdi");

  if (input) {
    input.value = ddi;
  }

  atualizarPhoneDdiSelecionado(ddi);
  fecharPhoneDdiDropdown();
};

function atualizarPhoneDdiSelecionado(ddi) {
  const selectedFlag = document.getElementById("selectedPhoneDdiFlag");
  const selectedText = document.getElementById("selectedPhoneDdiText");

  if (!selectedFlag || !selectedText) {
    return;
  }

  selectedFlag.innerHTML = "";

  const item = phoneDdiOptions.find((option) => option.ddi === ddi) || phoneDdiOptions[0];

  selectedFlag.appendChild(
    criarImagemBandeira(item.code, `Bandeira de ${item.country}`, "phone-ddi-flag-img")
  );

  selectedText.textContent = `${item.code.toUpperCase()} ${item.ddi}`;
}

function fecharPhoneDdiDropdown() {
  const dropdown = document.getElementById("phoneDdiDropdown");

  if (dropdown) {
    dropdown.classList.add("hidden");
  }
}

document.addEventListener("click", function (event) {
  const countryBox = document.querySelector(".country-selector-box");
  const phoneBox = document.querySelector(".phone-ddi-selector-box");

  if (countryBox && !countryBox.contains(event.target)) {
    fecharDropdownPais();
  }

  if (phoneBox && !phoneBox.contains(event.target)) {
    fecharPhoneDdiDropdown();
  }
});