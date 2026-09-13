# PicDrop — Plataforma SaaS Comercial para Fotógrafos & Estúdios

> **PicDrop** é uma solução completa de software como serviço (SaaS) projetada para fotógrafos profissionais, estúdios e produtoras visuais entregarem trabalhos com alta fidelidade, realizarem vendas de fotos adicionais e gerenciarem assinaturas com métodos de pagamento brasileiros (PIX Instantâneo, Cartão de Crédito em até 12x e Boleto).

---

## 🚀 Principais Funcionalidades

### 1. Experiência de Entrega de Galerias
- **Galerias de Alta Fidelidade**: Visualização de fotos em resolução 4K com layout masonry responsivo e lightbox de zoom.
- **Seleção Interativa com Favoritos (❤️)**: Clientes selecionam suas fotos favoritas com sincronização em tempo real.
- **Exportação para Adobe Lightroom Classic**: Exporta listas de arquivos aprovados formatadas para filtro direto na biblioteca do Lightroom Classic.
- **Proteção por PIN Seguro**: Download de pacotes de alta resolução com autenticação por código PIN criptografado (AES-256).

### 2. Motor de Checkout Seguro para o Mercado Brasileiro
- **PIX Instantâneo**: QR Code dinâmico em SVG, código Copia-e-Cola padronizado pelo Banco Central, temporizador regressivo e simulação de webhook bancário com aprovação em 2 segundos.
- **Cartão de Crédito 12x**: Cartão virtual 3D interativo com detecção em tempo real de bandeiras (Mastercard, Visa, Elo, American Express), máscaras de validação e parcelamento em até 12x.
- **Boleto Bancário Registrado**: Linha digitável e código de barras oficial com vencimento em 3 dias úteis.
- **Conformidade Fiscal (NFS-e)**: Coleta de CPF/CNPJ com máscara dinâmica e envio automático de nota fiscal eletrônica.
- **Garantia Incondicional de 7 Dias**: Conforme o Art. 49 do Código de Defesa do Consumidor (CDC).

### 3. Central de Faturamento & Assinaturas
- **Gestão de Plano Ativo**: Exibe plano atual (*Site + Galerias Studio* ou *Galerias Pro*), ciclo de faturamento e próximo vencimento.
- **Cartão Cadastrado**: Visualização segura do cartão em uso com opção de troca rápida.
- **Histórico de Faturas Conciliadas**: Registro detalhado com status de liquidação e botão para download de comprovantes.
- **Recibo Fiscal com Autenticação Digital**: Emissão de recibos fiscais com hash criptográfico SHA-256 e suporte nativo a impressão/salvamento em PDF.

### 4. Segurança & Domínios
- **Autenticação de Dois Fatores (2FA)**: Suporte a TOTP compatível com Google Authenticator e 1Password.
- **Gestão de Domínio Próprio**: Conexão de domínio personalizado (ex: `seusite.com.br`) com verificação DNS CNAME e certificado SSL automático.
- **Trilha de Auditoria**: Registro de sessões, endereços IP e dispositivos conectados.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5 Semântico, CSS3 Moderno (Glassmorphism, Variáveis CSS, Grid/Flexbox), JavaScript (ES6+ Modular).
- **Design System**: Tipografia Google Fonts (*Inter*, *Plus Jakarta Sans*, *JetBrains Mono*), paleta cromática Slate & Cobalt.
- **Deploy**: Otimizado para **Vercel** com `vercel.json` pré-configurado.

---

## 📦 Como Rodar Localmente

1. Clone o repositório ou baixe os arquivos:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd picdrop-saas
   ```

2. Inicie um servidor local (com Node.js, Python ou Live Server):
   ```bash
   # Opção 1: Com Node.js nativo (servidor incluído)
   node server.js

   # Opção 2: Com Python 3
   python -m http.server 4000
   ```

3. Abra no seu navegador:
   ```
   http://localhost:4000
   ```

---

## ⚡ Como Fazer Deploy no Vercel

### Opção 1: Via GitHub (Recomendada)
1. Crie um repositório no [GitHub](https://github.com/new) (ex: `picdrop-saas`).
2. Conecte o repositório local e envie os arquivos:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/picdrop-saas.git
   git push -u origin main
   ```
3. Acesse [vercel.com/new](https://vercel.com/new).
4. Selecione o repositório `picdrop-saas` e clique em **Deploy**.
5. Em menos de 30 segundos, sua aplicação estará no ar com domínio gratuito `.vercel.app` e SSL automático!

### Opção 2: Via Vercel CLI
1. Execute no terminal dentro da pasta do projeto:
   ```bash
   npx vercel
   ```
2. Siga os passos na tela (faça login no navegador e confirme o nome do projeto).
3. Para publicar em produção:
   ```bash
   npx vercel --prod
   ```

---

## 📄 Licença
Distribuído sob licença comercial. Todos os direitos reservados.
