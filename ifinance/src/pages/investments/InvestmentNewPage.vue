<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { investmentApi } from '@/services/api/investment'
import { useToast } from '@/composables/useToast'
import { INVESTMENT_TYPE_OPTIONS, RATE_BASIS_OPTIONS } from '@/core/constants'
import { InvestmentType, RateBasis } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const router = useRouter()
const toast = useToast()

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  investmentType: z.nativeEnum(InvestmentType),
  rateBasis: z.nativeEnum(RateBasis),
  rateValue: z.number({ invalid_type_error: 'Informe a taxa' }).positive(),
  principal: z.number({ invalid_type_error: 'Informe o valor' }).positive(),
  termDays: z.number({ invalid_type_error: 'Informe o prazo' }).int().positive(),
  startDate: z.string().min(1, 'Informe a data'),
})

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: '',
    investmentType: InvestmentType.CDB,
    rateBasis: RateBasis.CDI_PERCENT,
    rateValue: undefined as unknown as number,
    principal: undefined as unknown as number,
    termDays: undefined as unknown as number,
    startDate: new Date().toISOString().split('T')[0],
  },
})

const { value: name } = useField<string>('name')
const { value: investmentType } = useField<InvestmentType>('investmentType')
const { value: rateBasis } = useField<RateBasis>('rateBasis')
const { value: rateValue } = useField<number>('rateValue')
const { value: principal } = useField<number>('principal')
const { value: termDays } = useField<number>('termDays')
const { value: startDate } = useField<string>('startDate')

const investmentOptions = INVESTMENT_TYPE_OPTIONS.map((t) => ({ value: t.value, label: `${t.label} - ${t.description}` }))
const rateBasisOptions = RATE_BASIS_OPTIONS

const { mutate, isPending } = useMutation({
  mutationFn: (payload: Parameters<typeof investmentApi.create>[0]) => investmentApi.create(payload),
  onSuccess: (data) => {
    toast.success('Investimento criado com sucesso!')
    router.push(`/investments/${data.id}`)
  },
  onError: () => {
    toast.error('Erro ao criar investimento.')
  },
})

const onSubmit = handleSubmit((data) => {
  mutate(data)
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
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
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Novo Investimento</h1>
        <p class="text-sm text-[var(--text-muted)]">Configure os parâmetros do investimento</p>
      </div>
    </div>

    <form @submit.prevent="onSubmit">
      <AppCard>
        <div class="space-y-5">
          <AppInput
            v-model="name"
            label="Nome do Investimento"
            placeholder="ex: CDB Banco do Brasil"
            :error="errors.name"
            required
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppSelect
              v-model="investmentType"
              label="Tipo de Investimento"
              :options="investmentOptions"
              :error="errors.investmentType"
              required
            />

            <AppSelect
              v-model="rateBasis"
              label="Base da Taxa"
              :options="rateBasisOptions"
              :error="errors.rateBasis"
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="rateValue"
              label="Valor da Taxa"
              type="number"
              :min="0.01"
              :step="0.01"
              placeholder="110"
              :error="errors.rateValue"
              hint="Ex: 110 para 110% do CDI, ou 12.5 para 12,5% a.a."
              required
            />

            <AppInput
              v-model="principal"
              label="Valor Investido (R$)"
              type="number"
              :min="1"
              placeholder="10000"
              :error="errors.principal"
              required
            >
              <template #prefix>R$</template>
            </AppInput>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="termDays"
              label="Prazo (dias)"
              type="number"
              :min="1"
              placeholder="365"
              :error="errors.termDays"
              hint="Ex: 365 para 1 ano"
              required
            />

            <AppInput
              v-model="startDate"
              label="Data de Início"
              type="date"
              :error="errors.startDate"
              required
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <AppButton variant="secondary" type="button" @click="router.back()">Cancelar</AppButton>
          <AppButton type="submit" :loading="isPending">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </template>
            Calcular Investimento
          </AppButton>
        </div>
      </AppCard>
    </form>
  </div>
</template>
