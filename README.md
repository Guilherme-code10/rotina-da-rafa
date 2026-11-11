# Rotina da Rafa 🌷

Organizador de tarefas e produção de conteúdo com visual rosa, desenvolvido para iPhone, iPad e desktop. HTML semântico, CSS responsivo e JavaScript em módulos, sem bibliotecas externas ou etapa de build.

## Funcionalidades

- Meu dia: resumo, filtros por hoje, atrasadas, sem prazo e todas; prioridade.
- Clientes: cadastro e edição, programação até uma data, observações e vídeos pendentes.
- Produção: a fazer, em produção, aprovação e programado; mudança de etapa.
- Histórico: conclusão com data e hora, filtro por cliente e reabertura.
- Formulários acessíveis com labels, dialog nativo, navegação por teclado e regiões semânticas.
- Salvamento automático, atualização entre abas do mesmo navegador, exportação e restauração validada de backups JSON.

## Executar

Use um servidor HTTP; módulos JavaScript não funcionam corretamente ao abrir index.html com duplo clique.

Com Python 3 instalado, na pasta do projeto:

```sh
python -m http.server 3000
```

No macOS/Linux, use `python3` se necessário. Abra http://localhost:3000. Com Node.js 20.11+ também pode usar `npm run dev`. Não precisa de `npm install`.

## Publicar no GitHub Pages

1. Crie um repositório e envie **o conteúdo desta pasta**, com index.html na raiz.
2. Em Settings → Pages, selecione publicação por branch, branch `main`, pasta `/ (root)` e salve.
3. Abra a URL informada pelo GitHub após a publicação. Os caminhos relativos também funcionam em URLs com o nome do repositório.

Para enviar com Git, dentro da pasta extraída:

```sh
git init
git add .
git commit -m "Cria organizador Rotina da Rafa"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

A publicação do código não envia os registros criados no navegador ao GitHub. Porém, os nomes e informações iniciais estão em `assets/js/model.js`: remova-os antes de tornar público se desejar preservar esses dados. Não envie arquivos de backup pessoais ao repositório.

## Usar no iPhone e no iPad

Abra o endereço publicado no Safari. No menu Compartilhar, use Adicionar à Tela de Início. O layout muda automaticamente para o tamanho disponível. Esta versão precisa de conexão para carregar; não há cache offline nem notificações push.

**Os dados ficam no localStorage deste navegador e deste endereço. Não há login, servidor ou sincronização automática entre iPhone e iPad.** Navegação privada, limpeza dos dados do site ou troca de domínio podem eliminar ou separar os registros. Exporte backups regularmente em “Backup e dados” (no celular, toque no avatar R). Para transferir, exporte num aparelho e restaure no outro. A restauração substitui os dados, não mescla. Não edite nos dois aparelhos como se houvesse sincronização. Uma evolução para uso simultâneo requer backend e autenticação.

## Conteúdo inicial e regras

Os 16 clientes e 15 tarefas foram transcritos das notas de 11/11/2026. As datas de programação foram preservadas, com ano de 2026. Revise antes de usar. “BR Comunicações”, que não tinha uma ação especificada, virou “Definir demanda de BR Comunicações”. Não foram inventados prazos nem conclusões: tarefas iniciais estão em “A fazer” e sem prazo.

- Programação anterior a hoje: Revisar.
- Programação que termina hoje ou nos próximos 5 dias: Renovar.
- Acima de 5 dias: Em dia.
- Sem data e vídeos pendentes também aparecem no filtro de atenção.
- “Hoje” usa a data local do aparelho; concluir registra um instante ISO.
- Programado não significa concluído. Mude para concluído quando quiser registrar a entrega final.
- Excluir tarefa exige confirmação; para guardar o histórico, conclua.

## Organização

```text
index.html                  Estrutura semântica e diálogos
assets/css/styles.css       Design, componentes e responsividade
assets/js/app.js            Renderização, eventos e formulários
assets/js/model.js          Regras puras, validação e dados iniciais
assets/js/storage.js        Persistência local
assets/icon.svg             Ícone
tests/model.test.js        Testes das regras (Node.js 20+)
```

## Verificar

Com Node.js 20 ou superior:

```sh
npm run check
npm test
```

Não há chaves, credenciais, dependências de runtime ou serviços pagos. O código foi preparado para evoluir sem depender de uma plataforma de hospedagem específica.

## Verificação desta entrega

Quatro testes automatizados de regras e validação de backups passaram. No navegador de desktop foram conferidos carregamento, edição de prazo, conclusão, histórico, reabertura, persistência após recarregar e busca de clientes. Layout responsivo implementado; não foi testado em um iPhone/iPad físico.
