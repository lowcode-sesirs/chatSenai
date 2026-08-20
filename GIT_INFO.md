# 🔗 Informações do Repositório Git

## 📦 **Repositório GitHub**

```
https://github.com/guilhermenovak/FrontSuport.IA.git
```

---

## 🌿 **Branches**

### **Branch Atual**
```
implementacaoIASuporte
```

### **Comandos Git Úteis**

#### **Ver branches**
```bash
git branch -a
```

#### **Criar nova branch**
```bash
git checkout -b feature/nome-da-feature
```

#### **Mudar de branch**
```bash
git checkout nome-da-branch
```

#### **Atualizar do repositório remoto**
```bash
git pull origin implementacaoIASuporte
```

---

## 📝 **Workflow de Commit**

### **1. Verificar status**
```bash
git status
```

### **2. Adicionar arquivos**
```bash
# Adicionar arquivo específico
git add caminho/do/arquivo.js

# Adicionar todos os arquivos modificados
git add .
```

### **3. Fazer commit**
```bash
git commit -m "feat: descrição da mudança"
```

### **4. Push para o GitHub**
```bash
git push origin implementacaoIASuporte
```

---

## 🏷️ **Convenção de Commits**

Use prefixos semânticos nos commits:

```bash
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação (não afeta código)
refactor: # Refatoração de código
test:     # Adicionar testes
chore:    # Tarefas de manutenção
```

**Exemplos:**
```bash
git commit -m "feat: adicionar histórico de conversas"
git commit -m "fix: corrigir erro 401 na autenticação"
git commit -m "docs: atualizar README com novas URLs"
git commit -m "refactor: melhorar lógica do streaming"
```

---

## 🚫 **Arquivos Ignorados (.gitignore)**

Os seguintes arquivos **NÃO** devem ser commitados:

```
node_modules/
dist/
.env
.env.local
.firebase/
*.log
.cache/
```

---

## ⚠️ **IMPORTANTE: Segurança**

### **NUNCA commitar:**
- ❌ `.env` com credenciais reais
- ❌ `VITE_DEV_API_KEY` exposto
- ❌ Tokens JWT ou access tokens
- ❌ Credenciais Firebase (.firebaserc com dados sensíveis)
- ❌ Arquivos de build (`dist/`, `node_modules/`)

### **SEMPRE:**
- ✅ Usar `.env.example` como template
- ✅ Adicionar arquivos sensíveis no `.gitignore`
- ✅ Revisar `git status` antes de commit
- ✅ Fazer push apenas de código fonte

---

## 🔄 **Fluxo de Trabalho Recomendado**

### **Começando uma nova feature**

```bash
# 1. Atualizar branch principal
git checkout implementacaoIASuporte
git pull origin implementacaoIASuporte

# 2. Criar branch da feature
git checkout -b feature/nova-funcionalidade

# 3. Desenvolver e testar
npm run dev

# 4. Commit das mudanças
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 5. Push da branch
git push origin feature/nova-funcionalidade

# 6. Abrir Pull Request no GitHub
```

### **Sincronizar com branch principal**

```bash
# Atualizar sua branch local
git checkout implementacaoIASuporte
git pull origin implementacaoIASuporte

# Voltar para sua feature branch
git checkout feature/sua-feature

# Fazer merge das atualizações
git merge implementacaoIASuporte
```

---

## 📊 **Status Atual do Repositório**

### **Arquivos Modificados:**
- `.env`
- `.env.development`
- `.env.example`
- `.gitignore`
- `package.json`
- `src/App.jsx`
- `src/components/AIMessageContent.jsx`
- `src/components/MoodleAuthWrapper.jsx`
- `src/pages/Welcome.jsx`
- `src/services/chatService.js`
- `src/services/moodleAuthService.js`
- `src/utils/healthCheck.js`

### **Arquivos Novos:**
- `.env.eja`
- `README_GITHUB.md`
- `firebase.eja.json`
- `scripts/`
- `src/assets/suportia-logo.png`
- `src/assets/suportia-wordmark.png`

---

## 🔍 **Comandos Úteis para Verificação**

### **Ver histórico de commits**
```bash
git log --oneline
```

### **Ver diferenças**
```bash
# Ver mudanças não commitadas
git diff

# Ver mudanças de arquivo específico
git diff caminho/do/arquivo.js
```

### **Ver remotes configurados**
```bash
git remote -v
```

### **Ver branches remotas**
```bash
git branch -r
```

---

## 🔄 **Sincronização com GitHub**

### **Primeira vez (já configurado)**
```bash
git remote add origin https://github.com/guilhermenovak/FrontSuport.IA.git
```

### **Verificar conexão**
```bash
git remote -v
# Deve mostrar:
# origin  https://github.com/guilhermenovak/FrontSuport.IA.git (fetch)
# origin  https://github.com/guilhermenovak/FrontSuport.IA.git (push)
```

### **Push inicial**
```bash
git push -u origin implementacaoIASuporte
```

### **Pushes subsequentes**
```bash
git push
```

---

## 🐛 **Troubleshooting Git**

### **Erro: "Authentication failed"**
```bash
# Configurar credenciais
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Re-autenticar no GitHub
# Use Personal Access Token se necessário
```

### **Erro: "Untracked files"**
```bash
# Adicionar arquivos ao staging
git add .

# Ou adicionar apenas alguns
git add arquivo1.js arquivo2.js
```

### **Erro: "Merge conflict"**
```bash
# 1. Ver arquivos em conflito
git status

# 2. Resolver conflitos manualmente nos arquivos

# 3. Marcar como resolvido
git add arquivo-resolvido.js

# 4. Continuar merge/rebase
git commit
```

### **Desfazer último commit (local)**
```bash
# Manter mudanças no working directory
git reset --soft HEAD~1

# Descartar mudanças
git reset --hard HEAD~1
```

---

## 📞 **Suporte Git**

- **GitHub Docs:** https://docs.github.com
- **Git Docs:** https://git-scm.com/doc
- **Git Tutorial:** https://git-scm.com/docs/gittutorial

---

## ✅ **Checklist antes de Push**

- [ ] Revisei `git status`
- [ ] Não há arquivos sensíveis (.env com credenciais)
- [ ] Todos os testes passam localmente
- [ ] Build funciona (`npm run build`)
- [ ] Commit message é descritivo
- [ ] Branch está atualizada com `implementacaoIASuporte`
- [ ] `.gitignore` está correto

---

**Última atualização:** 2026-08-20
