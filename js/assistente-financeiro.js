document
.getElementById("btnImportar")
.addEventListener("click", importarArquivo);

function importarArquivo() {

    const arquivo =
        document.getElementById("arquivoExtrato")
        .files[0];

    if (!arquivo) {
        alert("Selecione um arquivo.");
        return;
    }

    alert(`Arquivo selecionado: ${arquivo.name}`);
}