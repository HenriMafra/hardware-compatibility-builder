# 🖥️ Hardware Compatibility Builder — Validador de Montagem de PC & Regras de Compatibilidade

Ferramenta interativa de montagem de computadores com **motor de validação de compatibilidade física, elétrica e dimensional em tempo real** (soquetes, chipsets, slots de memória, barramento PCIe, dissipação de calor TDP e potência de fonte de alimentação).

---

## 📌 Que Problema Resolve?

Montar um PC envolve dezenas de restrições técnicas interdependentes que usuários comuns desconhecem:
- Se a placa-mãe possui o soquete correto para o processador (ex: LGA1700, AM5, AM4).
- Se a geração de memória RAM bate com a placa-mãe (DDR4 vs. DDR5).
- Se a fonte de alimentação (PSU) tem potência suficiente para suprir os picos transitórios de energia de placas de vídeo modernas (ex: normas ATX 3.0 e conectores 12VHPWR).
- Se as dimensões físicas do cooler ou da placa de vídeo cabem no gabinete escolhido.

O **Hardware Compatibility Builder** resolve isso com um motor de regras que valida cada peça selecionada contra a lista de componentes já inseridos, alertando incompatibilidades instantaneamente antes da compra.

---

## ⚙️ Diferencial Técnico & Motor de Regras

### Regras de Compatibilidade Validadas:
1. **CPU × Motherboard:** Mapeamento bidirecional de Socket (`LGA1700`, `AM5`, `AM4`) e compatibilidade de Chipset (`B650`, `Z790`, `B550`).
2. **Motherboard × Memória:** Verificação de tipo (`DDR4` vs `DDR5`), quantidade máxima de slots (2 ou 4) e limite de frequência (MHz).
3. **Cálculo Dinâmico de Potência de Fonte (PSU):**
   $$\text{Potência Recomendada} = (\text{TDP}_{\text{CPU}} + \text{TDP}_{\text{GPU}} + \text{Margem Motherboard/Drives}) \times 1.25$$
   Inclui margem de segurança de 25% para evitar desarme por *transient spikes* de GPUs modernas.

---

## 🏗️ Stack Tecnológica

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion (diagrama interativo de conexões de cabos).
- **Backend Edge:** Cloudflare Pages Functions com banco Cloudflare D1.

---

## 🚀 Como Executar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/HenriMafra/hardware-compatibility-builder.git
cd hardware-compatibility-builder

# 2. Instale as dependências
npm install

# 3. Inicie o servidor local
npm run dev
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Desenvolvido por **Henri Mafra**.
