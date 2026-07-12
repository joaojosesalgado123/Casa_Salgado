# Casa Salgado — site e gestão de produtos

Site da Casa Salgado (ferragens e drogaria, Viana do Castelo, desde 1954) com uma
área de gestão simples para atualizar o catálogo sem tocar em código.

## Estrutura

```
index.html        → site público (catálogo, história, contactos, mapa)
gestao.html       → área de gestão de produtos (para o pai)
products.json     → o catálogo (é este ficheiro que a gestão altera)
css/style.css     → estilos partilhados
js/site.js        → lógica do site público
js/gestao.js      → lógica da gestão (grava via API do GitHub)
assets/           → fotografia da fachada
```

## Testar no computador

O catálogo é lido de `products.json` por `fetch`, e os browsers bloqueiam isso
quando se abre o ficheiro diretamente do disco. Duas opções:

1. **Só ver o aspeto**: abrir `index.html` no browser — funciona, mas mostra um
   catálogo de reserva reduzido.
2. **Testar a sério** (recomendado): na pasta do projeto, correr
   `python -m http.server 8000` e abrir `http://localhost:8000`.
   (Ou usar a extensão *Live Server* do VS Code.)

A página de gestão precisa sempre de internet, porque fala com o GitHub.

## Publicar (GitHub Pages, grátis)

1. Fazer commit e push destes ficheiros para o ramo `main` do repositório
   `joaojosesalgado123/Casa_Salgado`.
2. No GitHub: **Settings → Pages → Source: Deploy from a branch →
   Branch: `main` / `(root)` → Save**.
3. Passado um minuto, o site fica em
   `https://joaojosesalgado123.github.io/Casa_Salgado/`.

## Criar a chave de acesso para a gestão (fazer uma vez)

A página de gestão grava o `products.json` no repositório através da API do
GitHub. Para isso precisa de um *fine-grained personal access token*:

1. GitHub → foto de perfil → **Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token**.
2. Nome: `Gestao Casa Salgado`. Validade: escolher (máx. 1 ano; é preciso
   renovar quando expirar).
3. **Repository access**: *Only select repositories* → `Casa_Salgado`.
4. **Permissions → Repository permissions → Contents: Read and write**.
   Nada mais.
5. Gerar, copiar a chave e colá-la no passo 1 da página `gestao.html`,
   **no computador da loja**. Fica guardada no browser desse computador.

⚠️ A chave dá acesso de escrita a este repositório. Não a partilhar, não a
enviar por e-mail, e apagar/renovar no GitHub se houver suspeita de fuga.
Qualquer pessoa pode abrir a página de gestão, mas sem chave não consegue
alterar nada.

## Como o pai usa (dia a dia)

1. Abrir a página **Gestão** (guardar nos favoritos do browser da loja).
2. Carregar em **➕ Acrescentar produto** ou **✏️ Alterar** / **🗑️ Apagar**.
3. No fim, carregar no botão verde **💾 Guardar alterações no site**.
4. Um minuto depois, o site público está atualizado.
