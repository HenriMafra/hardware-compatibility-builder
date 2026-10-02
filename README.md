# Hardware Compatibility Builder: Constraint Satisfaction and Power Headroom Modeling

**Author:** Henri Mafra  
**License:** MIT License  
**Domain:** Expert Systems, Constraint Satisfaction Problems (CSP), Computer Engineering  

---

## 1. Overview

Hardware Compatibility Builder is an analytical configuration engine designed to model and enforce physical, electrical, and dimensional constraints during computer hardware assembly. The system solves the configuration validation problem as a **Deterministic Constraint Satisfaction Problem (CSP)**, preventing architectural incompatibilities (socket mismatches, bus generation conflicts) and modeling transient power excursion risks in modern ATX 3.0 power supply architectures.

---

## 2. Constraint Satisfaction Model

Let $C = \{c_{\text{cpu}}, c_{\text{mb}}, c_{\text{ram}}, c_{\text{gpu}}, c_{\text{psu}}, c_{\text{case}}\}$ represent the selected hardware configuration vector. The system evaluates compatibility over a constraint set $\Phi = \{\phi_1, \dots, \phi_m\}$:

### 2.1. Topological and Interface Constraints
1. **Socket Interlocking:**
   $$\phi_1(c_{\text{cpu}}, c_{\text{mb}}) \iff \text{Socket}(c_{\text{cpu}}) = \text{Socket}(c_{\text{mb}})$$
2. **Memory Generation and Topology:**
   $$\phi_2(c_{\text{ram}}, c_{\text{mb}}) \iff \text{DDR}(c_{\text{ram}}) = \text{DDR}(c_{\text{mb}}) \;\land\; \text{Dimms}(c_{\text{ram}}) \le \text{Slots}(c_{\text{mb}})$$
3. **PCIe Bus Width and Form Factor:**
   $$\phi_3(c_{\text{gpu}}, c_{\text{case}}) \iff \text{Length}(c_{\text{gpu}}) \le \text{MaxGpuLength}(c_{\text{case}})$$

### 2.2. Power Supply Sizing and Transient Excursions
Modern GPUs exhibit transient power spikes exceeding continuous Thermal Design Power (TDP) by up to $2.0\times$ for durations of $1\text{ms}$ to $10\text{ms}$. The continuous load $W_{\text{cont}}$ and peak load $W_{\text{peak}}$ are modeled as:

$$W_{\text{cont}} = \text{TDP}(c_{\text{cpu}}) + \text{TDP}(c_{\text{gpu}}) + \sum_{d \in \text{Peripherals}} W_d$$

$$W_{\text{recommended}} = W_{\text{cont}} \times \gamma, \quad \text{where } \gamma = 1.25$$

---

## 3. Architecture and Implementation

- **Engine Core:** Typed validation pipeline implementing functional predicate composition.
- **Frontend Layer:** React 18, TypeScript, Tailwind CSS, Framer Motion for connection graph rendering.
- **Data Persistence:** Cloudflare D1 distributed SQLite containing categorized component schemas.

---

## 4. Setup and Execution

```bash
# 1. Clone repository
git clone https://github.com/HenriMafra/hardware-compatibility-builder.git
cd hardware-compatibility-builder

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

---

## 5. References

- Russell, S., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.
- Intel Corporation. (2022). *Power Supply Design Guide for Desktop Platform Form Factors (ATX 3.0 / PCIe Gen 5)*.

---

## 6. License

Licensed under the MIT License. Copyright (c) Henri Mafra.
