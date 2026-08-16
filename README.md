# ⚡ PowerPlan Switcher

> Um utilitário de sistema integrado que unifica o gerenciamento do Windows, facilitando ajustes de performance de forma ágil e descomplicada.

---

## 🚀 Sobre o Projeto

O **PowerPlan Switcher** é uma ferramenta *all-in-one* desenvolvida em **Electron** e **React** (utilizando Fluent UI 2), projetada para entusiastas, gamers e *power users* que desejam monitorar, otimizar e controlar o Windows de forma centralizada e sem complicações.

---

## ✨ Funcionalidades Principais

* **📊 Dashboard:** Informações em tempo real do sistema (uso de CPU, Memória, Disco, Upload/Download) e os 3 principais processos em execução.
* **🖥️ Hardware Information:** Diagnóstico completo de Hardware (CPU, GPU, Memória, Discos, Unidades Removíveis, Rede, Áudio e Placa-mãe).
* **🌐 Rede:** Listagem de IPs/portas ativas em uso e opção de limpeza rápida do cache DNS.
* **⚙️ Processos:** Visualização detalhada de processos ativos com opção de encerramento seguro.
* **🚀 Inicialização:** Gerenciamento completo de programas que iniciam junto com o sistema operacional.
* **🧹 Limpador de Caches:** Limpeza profunda de caches do sistema e navegadores.
* **🗑️ Desinstalador:** Ferramenta prática para remoção de programas instalados.
* **🔋 Planos de Energia:** Troca rápida de planos de energia diretamente pela interface ou pelo ícone na **Bandeja do Sistema (System Tray)**, com sincronização em tempo real de via dupla.

---

## 🛠️ Tecnologias Utilizadas

* **[Electron](https://www.electronjs.org/)** — Framework para aplicações desktop multiplataforma.
* **[React](https://react.dev/)** — Biblioteca JavaScript para construção da interface de usuário.
* **[Microsoft Fluent UI 2](https://react.fluentui.dev/)** — Sistema de design moderno e nativo da Microsoft.
* **[Vite](https://vitejs.dev/)** — Empacotador e ferramenta de build de alta performance.
* **Node.js** — Backend local e integração nativa com comandos do Windows.

---

## ⚙️ Pré-requisitos

Certifique-se de ter instalado em sua máquina:
* **Node.js** (versão 18 ou superior recomendada)
* **npm** (geralmente instalado junto com o Node.js)

---

## 📦 Instalação, Execução e Compilação

Para configurar o projeto do zero, rodar em ambiente de desenvolvimento ou gerar o executável final para distribuição, siga o passo a passo abaixo no terminal na pasta raiz do projeto:

### 1. Clonar o repositório
```bash
git clone [https://github.com/tarsolisboa/pps-electron-windows.git](https://github.com/tarsolisboa/pps-electron-windows.git)
cd pps-electron-universal
```

### 2. Instalar as dependências
Instala todas as bibliotecas necessárias para o frontend e o backend do Electron:
```bash
npm install --save
```

### 3. Rodar a aplicação em modo de desenvolvimento
Inicia o aplicativo com suporte a recarga ao vivo (*Hot Reload*):
```bash
npm start
```

### 4. Compilar
Empacota a aplicação para gerar o executável final de distribuição para o Windows:
```bash
npm run package
```

### 5. Gerar o executável (Build)
Empacota a aplicação para gerar o executável final de distribuição para o Windows:
```bash
npm run make
```
*(Os arquivos gerados de build/empacotamento ficarão disponíveis na pasta de distribuição do projeto).*

---

## ☕ Apoie o Projeto

Se o **PowerPlan Switcher** foi útil para você, considere apoiar o desenvolvimento do projeto!

---

## 📄 Licença

Este projeto é distribuído sob a licença [MIT](LICENSE). Sinta-se à vontade para contribuir, abrir *issues* ou sugerir melhorias!