# OdontoGest
Aplicativo PWA para controle financeiro de profissionais de odontologia autônomos.

## Recursos da versão beta
- Registro de diárias e procedimentos com recebimentos confirmados ou pendentes
- Cadastro de materiais e consumo integrado ao atendimento
- Compras de reposição, inclusive a prazo
- Despesas pagas e contas a pagar
- Resumo de caixa, compromissos e reserva de reposição
- Backup JSON manual e recuperação
- Dados armazenados somente no próprio dispositivo (IndexedDB)
- Instalável como PWA no Chromebook e Android, após acesso inicial online

## Privacidade
Este é um projeto experimental, não um prontuário. Não insira nomes de pacientes, CPF, telefone ou informações clínicas sensíveis. O GitHub Pages publica somente arquivos estáticos, não os registros cadastrados. Faça backups frequentes e guarde-os em local seguro.

## Implantação
GitHub Actions executa os testes e publica a pasta raiz no GitHub Pages. No repositório, selecione Settings > Pages > Build and deployment > Source: GitHub Actions. A URL esperada é https://jeanoliveira195-dotcom.github.io/odontogest/.

## Desenvolvimento
Node.js 22+; executar `npm test`. Para desenvolvimento local use um servidor HTTP, não abra index.html como file://. Não há dependências externas e o app não exige banco de dados remoto.

## Observações financeiras
O saldo disponível é uma estimativa gerencial, não substitui conciliação bancária, cálculo de tributos ou orientação contábil. A reserva para reposição não é uma compra e não é abatida novamente como saída de caixa quando o material é comprado. Reposição e compromissos são apurados pelo estoque e contas pendentes atuais.
