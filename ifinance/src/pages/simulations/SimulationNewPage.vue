<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { simulationApi } from '@/services/api/simulation'
import { useToast } from '@/composables/useToast'
import { useFormatBR } from '@/composables/useFormatBR'
import { AMORTIZATION_SYSTEMS, PERIODICITY_OPTIONS, RATE_TYPE_OPTIONS, ECONOMIC_INDEX_OPTIONS } from '@/core/constants'
import { AmortizationSystem, EconomicIndex, Periodicity, RateType, ChargeType } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'

const router = useRouter()
const toast = useToast()
const { formatCurrency } = useFormatBR()

const currentStep = ref(1)
const totalSteps = 3

const step1Schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  amortizationSystem: z.nativeEnum(AmortizationSystem),
  principal: z.number({ invalid_type_error: 'Informe o valor' }).positive('Deve ser positivo'),
  interestRate: z.number({ invalid_type_error: 'Informe a taxa' }).positive('Deve ser positiva').max(100),
  rateType: z.nativeEnum(RateType),
  term: z.number({ invalid_type_error: 'Informe o prazo' }).int().positive().max(600),
  periodicity: z.nativeEnum(Periodicity),
})

const fullSchema = step1Schema.extend({
  cetEnabled: z.boolean(),
  inflationCorrectionEnabled: z.boolean(),
  inflationIndex: z.string().optional(),
})

const { handleSubmit, errors, values, setFieldValue } = useForm({
  validationSchema: toTypedSchema(fullSchema),
  initialValues: {
    name: '',
    amortizationSystem: AmortizationSystem.SAC,
    principal: undefined as unknown as number,
    interestRate: undefined as unknown as number,
    rateType: RateType.NOMINAL,
    term: undefined as unknown as number,
    periodicity: Periodicity.MONTHLY,
    cetEnabled: true,
    inflationCorrectionEnabled: false,
    inflationIndex: undefined,
  },
})

const { value: name } = useField<string>('name')
const { value: amortizationSystem } = useField<AmortizationSystem>('amortizationSystem')
const { value: principal } = useField<number>('principal')
const { value: interestRate } = useField<number>('interestRate')
const { value: rateType } = useField<RateType>('rateType')
const { value: term } = useField<number>('term')
const { value: periodicity } = useField<Periodicity>('periodicity')
const { value: cetEnabled } = useField<boolean>('cetEnabled')
const { value: inflationCorrectionEnabled } = useField<boolean>('inflationCorrectionEnabled')
const { value: inflationIndex } = useField<string | undefined>('inflationIndex')

interface Charge {
  description: string
  chargeType: ChargeType
  amount: number
}

const charges = ref<Charge[]>([])

function addCharge() {
  charges.value.push({ description: '', chargeType: ChargeType.PERCENTAGE, amount: 0 })
}

function removeCharge(i: number) {
  charges.value.splice(i, 1)
}

const amortizationOptions = AMORTIZATION_SYSTEMS.map((s) => ({ value: s.value, label: `${s.label} - ${s.description}` }))
const periodicityOptions = PERIODICITY_OPTIONS
const rateTypeOptions = RATE_TYPE_OPTIONS
const indexOptions = ECONOMIC_INDEX_OPTIONS
const chargeTypeOptions = [
  { value: ChargeType.PERCENTAGE, label: 'Percentual (%)' },
  { value: ChargeType.FIXED, label: 'Fixo (R$)' },
]

function nextStep() {
  currentStep.value++
}

function prevStep() {
  currentStep.value--
}

const { mutate, isPending } = useMutation({
  mutationFn: (payload: Parameters<typeof simulationApi.create>[0]) => simulationApi.create(payload),
  onSuccess: (data) => {
    toast.success('Simulação criada com sucesso!')
    router.push(`/simulations/${data.id}`)
  },
  onError: () => {
    toast.error('Erro ao criar simulação', 'Verifique os dados e tente novamente.')
  },
})

const onSubmit = handleSubmit((data) => {
  mutate({
    ...data,
    inflationIndex: data.inflationCorrectionEnabled ? (data.inflationIndex as EconomicIndex | undefined) : undefined,
    charges: charges.value.map((c) => ({
      ...c,
      appliesOnPeriod: null,
    })),
  })
})

const steps = [
  { number: 1, label: 'Dados Básicos' },
  { number: 2, label: 'Encargos' },
  { number: 3, label: 'Revisão' },
]
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        class="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-colors"
        @click="router.back()"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Nova Simulação</h1>
        <p class="text-sm text-[var(--text-muted)]">Configure os parâmetros do financiamento</p>
      </div>
    </div>

    <!-- Step indicators -->
    <div class="flex items-center gap-0">
      <div
        v-for="(step, i) in steps"
        :key="step.number"
        class="flex items-center"
      >
        <div class="flex items-center gap-2">
          <div
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
              currentStep === step.number
                ? 'bg-indigo-500 text-white'
                : currentStep > step.number
                ? 'bg-emerald-500 text-white'
                : 'bg-[var(--border-subtle)] text-[var(--text-muted)]',
            ]"
          >
            <svg v-if="currentStep > step.number" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ step.number }}</span>
          </div>
          <span
            :class="[
              'text-sm font-medium hidden sm:block',
              currentStep === step.number ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
            ]"
          >
            {{ step.label }}
          </span>
        </div>
        <div v-if="i < steps.length - 1" class="mx-4 h-px w-12 bg-[var(--border-subtle)]" />
      </div>
    </div>

    <form @submit.prevent="onSubmit">
      <!-- Step 1: Basic info -->
      <AppCard v-if="currentStep === 1">
        <div class="space-y-5">
          <AppInput
            v-model="name"
            label="Nome da Simulação"
            placeholder="ex: Financiamento Imobiliário 2026"
            :error="errors.name"
            required
          />

          <AppSelect
            v-model="amortizationSystem"
            label="Sistema de Amortização"
            :options="amortizationOptions"
            :error="errors.amortizationSystem"
            required
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="principal"
              label="Valor do Financiamento (R$)"
              type="number"
              :min="1"
              :step="1000"
              placeholder="350000"
              :error="errors.principal"
              required
            >
              <template #prefix>R$</template>
            </AppInput>

            <AppInput
              v-model="interestRate"
              label="Taxa de Juros (%)"
              type="number"
              :min="0.01"
              :max="100"
              :step="0.01"
              placeholder="11.75"
              :error="errors.interestRate"
              required
            >
              <template #suffix>%</template>
            </AppInput>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AppSelect
              v-model="rateType"
              label="Tipo de Taxa"
              :options="rateTypeOptions"
              :error="errors.rateType"
              required
            />

            <AppInput
              v-model="term"
              label="Prazo"
              type="number"
              :min="1"
              :max="600"
              placeholder="360"
              :error="errors.term"
              required
            />

            <AppSelect
              v-model="periodicity"
              label="Periodicidade"
              :options="periodicityOptions"
              :error="errors.periodicity"
              required
            />
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <AppButton type="button" @click="nextStep">
            Próximo
            <template #icon-right>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </template>
          </AppButton>
        </div>
      </AppCard>

      <!-- Step 2: Charges and correction -->
      <AppCard v-else-if="currentStep === 2">
        <div class="space-y-6">
          <!-- CET -->
          <div class="space-y-1">
            <AppToggle
              v-model="cetEnabled"
              label="Calcular CET (Custo Efetivo Total)"
              description="Inclui todos os encargos no cálculo do custo efetivo"
            />
          </div>

          <!-- Charges -->
          <div v-if="cetEnabled">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-[var(--text-secondary)]">Encargos Adicionais</h3>
              <AppButton variant="ghost" size="sm" type="button" @click="addCharge">
                <template #icon-left>
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </template>
                Adicionar encargo
              </AppButton>
            </div>

            <div v-if="charges.length" class="space-y-3">
              <div
                v-for="(charge, i) in charges"
                :key="i"
                class="flex gap-3 items-end rounded-lg border border-[var(--border-subtle)] p-3"
              >
                <div class="flex-1">
                  <AppInput
                    v-model="charge.description"
                    label="Descrição"
                    placeholder="ex: Seguro MIP"
                    :name="`charge-desc-${i}`"
                  />
                </div>
                <div class="w-36">
                  <AppSelect
                    v-model="charge.chargeType"
                    label="Tipo"
                    :options="chargeTypeOptions"
                    :name="`charge-type-${i}`"
                  />
                </div>
                <div class="w-28">
                  <AppInput
                    v-model="charge.amount"
                    label="Valor"
                    type="number"
                    :step="charge.chargeType === ChargeType.PERCENTAGE ? 0.001 : 1"
                    :name="`charge-amount-${i}`"
                  />
                </div>
                <button
                  type="button"
                  class="mb-0.5 rounded p-2 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  @click="removeCharge(i)"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-[var(--text-muted)]">Nenhum encargo adicionado.</p>
          </div>

          <!-- Inflation correction -->
          <div class="border-t border-[var(--border-subtle)] pt-4 space-y-3">
            <AppToggle
              v-model="inflationCorrectionEnabled"
              label="Correção Monetária"
              description="Aplica índice econômico sobre o saldo devedor"
            />

            <AppSelect
              v-if="inflationCorrectionEnabled"
              v-model="inflationIndex"
              label="Índice de Correção"
              :options="indexOptions"
              placeholder="Selecione o índice"
            />
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <AppButton variant="secondary" type="button" @click="prevStep">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </template>
            Anterior
          </AppButton>
          <AppButton type="button" @click="nextStep">
            Revisar
            <template #icon-right>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </template>
          </AppButton>
        </div>
      </AppCard>

      <!-- Step 3: Review -->
      <AppCard v-else-if="currentStep === 3">
        <div class="space-y-4">
          <h3 class="text-base font-semibold text-[var(--text-primary)]">Revisão dos dados</h3>

          <div class="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            <div class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">Nome</span>
              <span class="font-medium text-[var(--text-primary)]">{{ values.name }}</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">Sistema</span>
              <span class="font-medium text-[var(--text-primary)]">{{ values.amortizationSystem }}</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">Valor</span>
              <span class="font-medium text-[var(--text-primary)]">{{ formatCurrency(values.principal) }}</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">Taxa</span>
              <span class="font-medium text-[var(--text-primary)]">{{ values.interestRate }}% ({{ values.rateType }})</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">Prazo</span>
              <span class="font-medium text-[var(--text-primary)]">{{ values.term }} períodos ({{ values.periodicity }})</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">CET</span>
              <span class="font-medium text-[var(--text-primary)]">{{ values.cetEnabled ? 'Habilitado' : 'Desabilitado' }}</span>
            </div>
            <div v-if="charges.length" class="flex justify-between px-4 py-3 text-sm">
              <span class="text-[var(--text-muted)]">Encargos</span>
              <span class="font-medium text-[var(--text-primary)]">{{ charges.length }} encargo(s)</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between mt-6">
          <AppButton variant="secondary" type="button" @click="prevStep">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </template>
            Anterior
          </AppButton>
          <AppButton type="submit" :loading="isPending">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </template>
            Calcular Simulação
          </AppButton>
        </div>
      </AppCard>
    </form>
  </div>
</template>
