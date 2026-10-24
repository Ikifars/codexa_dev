# Integração de licença remota

## 1. Criar a licença

No painel administrativo, crie a licença para o sistema e informe, opcionalmente, o domínio autorizado (por exemplo, `cliente.com.br`). O domínio aceita o endereço exato e seus subdomínios. Não inclua `https://`, portas ou caminhos.

## 2. Instalar o script

Copie a tag exibida no painel para o HTML do sistema cliente, de preferência antes do fechamento de `</body>`:

```html
<script src="https://SEU-PAINEL/client-script.js?token=SUA_CHAVE&api=https%3A%2F%2FSEU-PAINEL%2Fapi%2Flicenses%2Fvalidate" defer></script>
```

A chave deve ficar no parâmetro `token`. Não a coloque em logs ou repositórios públicos.

## 3. Marcar os módulos

Na licença, marque o módulo como contratado e depois habilite-o. O script remove elementos com `data-license-module="codigo-do-modulo"` quando o módulo não estiver liberado.

Para ações que devem permanecer visíveis, mas bloqueadas, use `data-license-action="codigo-do-modulo"`.

## 4. Validar no sistema cliente

A validação envia `POST` para `/api/licenses/validate` com `Authorization: Bearer SUA_CHAVE`. A resposta informa `valid` e a lista de módulos. O domínio de origem é verificado no servidor.

## 5. Suspensão e atualização

A licença é revalidada a cada carregamento. Ao suspender, expirar ou bloquear a licença, o sistema cliente mostra a mensagem de suspensão e deixa de expor os módulos não liberados.
