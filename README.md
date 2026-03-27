# Vector Paint

App de colorir vetorial feito com React, TypeScript, Vite e Tailwind CSS.

## Demo

[Acesse aqui](https://haroldorodsilva.github.io/vector-paint/)

## Desenvolvimento

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para producao
npm run build

# Rodar testes
npm run test
```

## Supabase (opcional)

A app funciona normalmente com `localStorage` sem configuração adicional. Para habilitar o backend Supabase (necessário para o painel admin), siga os passos abaixo:

### 1. Criar o projeto no Supabase

Crie um projeto em [supabase.com](https://supabase.com) e execute o schema SQL em `supabase/schema.sql` no **SQL Editor** do painel.

### 2. Configurar variáveis de ambiente

**Desenvolvimento local** — Copie `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Deploy no GitHub Pages** — As variáveis precisam ser cadastradas como *Secrets* no repositório, pois o arquivo `.env.local` não é enviado para o Git. Siga os passos:

1. No GitHub, acesse **Settings → Secrets and variables → Actions** do repositório.
2. Clique em **New repository secret** e cadastre as duas variáveis:
   - `VITE_SUPABASE_URL` — URL do projeto Supabase (ex: `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — chave pública `anon` do projeto
3. O workflow `deploy.yml` já está configurado para injetar esses secrets automaticamente no build.

> **Atenção:** a `ANON_KEY` é segura para expor no frontend — ela é pública por design e protegida pelas políticas RLS do Supabase.

### 3. Criar usuário admin

No painel do Supabase, vá em **Authentication → Users** e crie um usuário com e-mail e senha.

### Painel Admin

Acesse `/admin` na aplicação para fazer login e gerenciar categorias e desenhos via Supabase.

- **Categorias**: criar, editar e remover categorias.
- **Desenhos**: fazer upload de SVGs, editar nome/categoria e remover desenhos.

Os dados salvos no Supabase aparecem automaticamente na galeria para todos os usuários.

## Tecnologias

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase
- Vitest

## Licenca

MIT
