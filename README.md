# Ponderada 4 - EntreSessoes

## Sobre o projeto

O **EntreSessoes** nasceu da ideia de criar uma aplicação mobile que ajudasse no acompanhamento emocional entre uma sessão e outra de terapia. A proposta foi pensar em dois lados do fluxo: o da psicóloga, que precisa acompanhar pacientes, registrar sessões e compartilhar credenciais de acesso, e o do paciente, que precisa de um espaço simples para registrar como está se sentindo no dia a dia.


O projeto foi pensado com diário emocional, gravação de áudio, clima no momento do registro, notificações locais, compartilhamento nativo e integração completa com backend.

## Problema que a aplicação tenta resolver

Uma sessão de terapia normalmente não resume tudo o que a pessoa vive ao longo da semana. Muitas vezes o paciente sente algo importante em um dia específico, mas chega à próxima consulta sem lembrar com clareza do que aconteceu, de como se sentiu ou do contexto daquele momento.

O EntreSessoes tenta diminuir esse vazio entre encontros. O paciente pode escrever ou gravar um diário, e a psicóloga pode acompanhar os registros compartilhados e organizar melhor sua agenda e seus pacientes. A ideia não foi substituir a terapia, mas criar uma ponte mais útil entre a experiência cotidiana e o acompanhamento clínico.

## Stack escolhida

- React Native com Expo no frontend mobile
- NestJS com TypeScript no backend
- Supabase/PostgreSQL como banco e storage
- Open-Meteo como API externa de clima

## Por que escolhi essa stack

### React Native com Expo

Escolhi React Native com Expo porque eu queria construir uma experiência de aplicativo de verdade, com acesso a recursos do celular, mas sem aumentar demais o custo de setup. Como o projeto exigia recurso mobile real, notificação, microfone, localização e compartilhamento, o Expo ajudou a deixar esse processo mais direto.

Também gostei do fato de conseguir iterar rápido na interface. Como o projeto teve várias mudanças de fluxo ao longo do desenvolvimento, essa rapidez fez diferença.

### NestJS com TypeScript

No backend, eu escolhi NestJS porque ele me ajuda a pensar o projeto em camadas com mais disciplina. Controller, service, repository e module me deram uma estrutura boa para separar regra de negócio, acesso a dados e detalhe HTTP.

TypeScript entrou pela mesma razão de outros projetos meus: deixar os contratos mais claros. Como o app tem autenticação, perfis diferentes, sessões, diários, pacientes e clima, ter DTOs e entidades explicitando forma de entrada e saída me ajudou a manter o projeto menos confuso. Além de eu gostar muito dessa stack <3

### Supabase

O Supabase fez sentido porque eu precisava de uma persistência real, acessível e prática de configurar para um MVP. Além do banco PostgreSQL, ele também resolveu a parte de storage para os áudios do diário. Isso simplificou bastante o projeto, porque eu não precisei separar mais uma infraestrutura só para arquivos.

### Open-Meteo

A API externa escolhida foi a Open-Meteo. Ela foi usada para enriquecer o diário com contexto de clima a partir da localização do paciente no momento do registro. A escolha fez sentido porque agregava valor funcional real ao app sem complicar autenticação por chave ou custo de uso no MVP.

## Funcionalidades implementadas

### No lado da psicóloga

- cadastro e login
- cadastro de pacientes com senha provisória
- compartilhamento nativo das credenciais do paciente
- listagem de pacientes
- criação, edição, conclusão e cancelamento de sessões
- visualização de diários compartilhados pelos pacientes

### No lado do paciente

- login
- troca de senha no primeiro acesso
- criação de diário por texto ou áudio
- captura de localização para enriquecer o diário com clima
- visualização dos próprios diários
- compartilhamento do diário com a psicóloga
- visualização das sessões agendadas e passadas

## Recursos mobile utilizados

O projeto atende ao requisito de uso de hardware e recursos nativos do celular com:

- **microfone**: para gravação de áudio no diário
- **localização/GPS**: para buscar clima do local do registro
- **compartilhamento nativo**: para enviar as credenciais do paciente
- **notificações locais**: para lembrar o paciente de escrever no diário e lembrar sessões futuras

## API externa utilizada

A aplicação consome a **Open-Meteo** no backend. O frontend envia latitude e longitude quando o paciente cria um diário. O backend consulta a API, extrai temperatura e descrição do clima e salva essas informações junto com o registro.

## Estrutura geral do projeto

O repositório está separado em:

- `src/frontend`: aplicação mobile em React Native/Expo
- `src/backend`: API em NestJS

No frontend, a organização principal ficou separada por responsabilidade técnica:

- `app`: ponto de entrada do Expo Router
- `src/screens`: telas
- `src/components`: componentes reutilizáveis
- `src/state`: estado global e contexto
- `src/services`: API, storage, notificações e integrações
- `src/hooks`: hooks da aplicação
- `src/theme`: tokens visuais
- `src/types`: contratos e tipos
- `src/utils`: helpers

No backend, a organização segue a separação por módulos e camadas:

- `auth`
- `patients`
- `sessions`
- `diary`
- `weather`
- `infra/database`

Essa divisão não foi feita só por estética. Ela foi importante para eu conseguir mexer em autenticação, diário, áudio, clima e sessões sem transformar tudo em um bloco único de código.

## Como o projeto foi sendo construído

O desenvolvimento não foi linear. Primeiro eu foquei no backend, muito porque é uma parte com a qual eu já tenho mais facilidade e também gosto mais de construir. Então comecei estruturando autenticação, pacientes, sessões, diário e as integrações principais do lado da API antes de partir para a camada mobile.

Depois fui para o frontend. No começo, eu fiz boa parte do fluxo de forma mockada para conseguir desenhar a navegação, validar as telas e entender melhor como a experiência do app deveria funcionar. Isso me ajudou a ganhar velocidade no início, sem depender de toda a integração já estar pronta.

Quando essa base ficou mais clara, comecei a integrar o frontend com o backend de verdade. Essa etapa me obrigou a revisar bastante coisa: contratos, mensagens de erro, retorno das rotas, atualização de estado no app e até alguns ajustes nas próprias rotas do backend quando eu percebia que o front ia precisar de um formato diferente ou de alguma informação a mais.

Também fui ajustando a organização do frontend ao longo do caminho. Em vez de deixar tudo preso a uma estrutura improvisada, reorganizei o projeto em telas, componentes, estado, serviços e utilitários. Isso deixou a navegação no código bem melhor e me ajudou a enxergar mais claramente o papel de cada parte.


## Requisitos da ponderada atendidos

- aplicação mobile desenvolvida com tecnologia mobile adequada: **React Native com Expo**
- mais de duas telas: **sim**
- navegação funcional: **sim**
- backend integrado: **sim**
- banco de dados com persistência: **sim**
- API externa: **sim, Open-Meteo**
- compartilhamento: **sim**
- notificações: **sim, locais**
- uso de hardware do celular: **sim, microfone e localização**

## Demonstração e acesso

Vídeo de demonstração:

- https://drive.google.com/file/d/1bXqJoU4czynSOuxmaUFc-Z4GJNxLpyV6/view?usp=sharing

Backend deployado:

- API base: `https://pond-prog-s08-m10.onrender.com`
- Swagger: `https://pond-prog-s08-m10.onrender.com/docs`

## Como executar o projeto

### Backend

Entre na pasta:

```bash
cd src/backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` com base no `.env.example`:

```env
SUPABASE_DB_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
JWT_SECRET=
JWT_EXPIRES_IN=7d
```

Rode o backend:

```bash
npm run start:dev
```

Swagger:

```text
http://localhost:3000/docs
```

### Frontend

Entre na pasta:

```bash
cd src/frontend
```

Instale as dependências:

```bash
npm install
```

Rode o app:

```bash
npx expo start
```

Observação importante:

- para testes gerais de interface, o Expo Go atende bem

## Considerações finais

Se eu continuasse evoluindo o EntreSessoes, os próximos passos mais naturais seriam melhorar a experiência de notificação, aprofundar o fluxo clínico de acompanhamento do paciente e deixar algumas interações do frontend ainda mais refinadas.
