# Riscado

Todo list LIFO pra Android, com cara de post-it recortado e quadrinho.

- item novo entra no **topo**
- arrasta pro lado (qualquer direção) → item é arremessado, bate na borda (**POW!**) e sai da lista
- riscados ficam na tela **Riscados** (mais recente primeiro, pra sempre); **VOLTA** devolve pro topo
- segura e arrasta pra reordenar
- adição rápida: digita, "enviar", teclado continua aberto
- várias listas no menu lateral
- sync bidirecional com um repositório no GitHub → um `.md` por lista, pronto pro Obsidian

## Baixar

APK em [Releases](../../releases).

## Formato do .md

```md
# Mercado

- Comprar leite ^k3f9a2
    integral, 2L
- Ligar pro dentista ^p0q1w2
- ~~Pão~~ ^e5f6g7
```

- pendentes primeiro, na ordem da lista; riscados depois (`~~texto~~`), mais recente primeiro
- notas = linhas indentadas abaixo do item
- `^id` é block id do Obsidian, usado pra casar itens no sync. Item escrito à mão sem id ganha um no próximo sync
- também aceita `- [ ] x` / `- [x] x`, `*` e `+`

## GitHub

No app: menu → **GitHub**.

1. **Conta**: token pessoal *fine-grained* com permissão **Contents: Read and write** só no repo do vault
   ([criar](https://github.com/settings/personal-access-tokens/new)). Ou "Entrar com GitHub" se o build tiver client id (abaixo).
2. **Repositório**: `usuario/repo`, branch (vazio = padrão) e pasta (ex: `todos`).
3. Pronto. Sincroniza ao abrir, ao voltar pro app e alguns segundos depois de editar.
   `.md` que já existirem na pasta viram listas.

Conflito: merge por item (3-way). Se app e Obsidian mudarem o mesmo campo do mesmo item, o app vence.

### Login com GitHub (device flow), opcional

1. [Criar OAuth App](https://github.com/settings/applications/new) (callback URL qualquer, ex: `https://github.com`)
2. Marcar **Enable Device Flow**
3. No repo deste projeto: Settings → Variables → Actions → `GH_OAUTH_CLIENT_ID` = client id

## Release

```sh
./scripts/setup-signing.sh      # uma vez: gera keystore e grava secrets do repo
git tag v0.1.0 && git push --tags
```

Workflow `.github/workflows/release.yml` builda o APK e publica no Release da tag.
**Guarde o keystore** (`~/.android-keys/`): sem ele, versões novas não instalam por cima.

## Dev

```sh
npm install
npm test            # parser, merge, sync
npm run typecheck
npm run android     # precisa Android SDK (expo run:android)
npx expo start --web  # preview no navegador (storage em localStorage, sem secure-store)
```

Stack: Expo 58, expo-router (drawer), reanimated 4, gesture-handler, react-native-reorderable-list, zustand + expo-sqlite kv-store, react-native-svg.

```
src/
  app/          telas (a fazer, riscados, github) e layout com drawer
  components/   cards, adição rápida, menu, diálogos
  domain/       tipos, markdown parse/serialize, merge 3-way
  github/       api, device flow, base64 utf8
  store/        zustand persistido
  sync/         engine de sync + auto sync
  ui/           tema, papel recortado, halftone, risco à mão, impacto
```
