<p align="right"><a href="README.md">中文</a> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ru.md">Русский</a> | <a href="README.pt.md">Português</a></p>

# Gerenciamento de Skills e MCP do DSH

Um plugin da barra lateral do DSH para gerenciar Skills locais e servidores MCP. A interface usa os tokens de tema do DSH, não incorpora um iframe e mantém a entrada `Skills e MCP`.

O diretório global `~/.agents/skills` não entra no catálogo de Skills do modelo. Apenas os Skills sincronizados explicitamente são adicionados ao DSH.

![Gerenciamento de Skills](docs/screenshots/overview.png)

## Recursos

- Pesquisar, criar, editar, ativar, desativar e excluir Skills de usuário e de projeto.
- Ocultar o diretório Agent global do catálogo do modelo e sincronizar apenas os Skills escolhidos.
- Sincronização por link simbólico ou cópia, exibição do modo, prévia e backup antes de substituir.
- Seleção múltipla com caixas de seleção e exclusão em lote.
- Importar pacotes de Skill `.zip` arrastando e soltando ou escolhendo um arquivo.
- Editar entradas do MCP Manager e MCP independentes em formulário ou JSON, testar conexão, reconectar, importar e solicitar aprovação do Host.
- Atualização automática para instalações npm e notas do GitHub Releases.

## Instalação

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

Para instalar a partir do código, clone o repositório, execute `npm install --ignore-scripts` e selecione o diretório em DSH em **Plugins → Adicionar plugin**. A versão atual é verificada para DSH `0.2.3-alpha.2`.

## Idiomas

A interface segue **Configurações do DSH → Geral → Idioma** e oferece os oito idiomas `zh`, `en`, `ja`, `es`, `fr`, `de`, `ru` e `pt`. Ao trocar o idioma, a interface é atualizada automaticamente.

As listas de Skills e MCP não são traduzidas. Nomes, descrições, conteúdo do SKILL.md, comandos e URLs permanecem no idioma original.

## Dados e permissões

Acessa arquivos locais em `~/.dsh/skills`, `~/.agents/skills`, `~/.dsh/capability-switch` e o `cordis.patch.yml` do perfil DSH ativo. O acesso à rede é limitado ao registro npm (atualização automática) e à API do GitHub Releases (notas de versão). Não envia Skills, configuração MCP ou credenciais.

## Documentação

A documentação completa está disponível em [English](README.en.md) ou [中文](README.md).

## Licença

[MIT](LICENSE)
