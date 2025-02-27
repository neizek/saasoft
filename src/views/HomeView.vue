<script setup lang="ts">
import { useRecordsStore, type Record } from '@/stores/records'
import type { InputType, QTableColumn, QTdProps } from 'quasar'
import { ref, type Ref } from 'vue'

// Types and interfaces

type Rule = (val: string) => string | true

interface InputProps {
  type: InputType
  rules?: Rule[]
}

interface SelectProps {
  items: {
    value: string | number
    label: string
  }[]
  rules?: Rule[]
}

interface RowElement {
  fieldRef: HTMLElement | undefined
  fieldProps: InputProps | SelectProps
  value: string[] | string | null
}

interface RowSelectElement extends RowElement {
  field: 'select'
  fieldProps: SelectProps
}

interface RowInputElement extends RowElement {
  field: 'input'
  fieldProps: InputProps
}

interface Row {
  id: number
  tags: RowInputElement
  type: RowSelectElement
  login: RowInputElement
  password: RowInputElement
}

type SelectItem = {
  value: string
  label: string
}

// Validators for inputs

const required = (val: string | SelectItem) => {
  const errorText = 'Это обязательное поле'

  if (typeof val === 'string') {
    return (val !== undefined && val.length > 0) || errorText
  } else {
    return (val.value !== undefined && val.value.length > 0) || errorText
  }
}

const limitedLength = (val: string, length: number) => {
  return val.length <= length || `Максимальное количество символов - ${length}`
}

// Constants

const recordsStore = useRecordsStore()

const recordTypes: SelectItem[] = [
  { value: 'ldap', label: 'LDAP' },
  { value: 'local', label: 'Локальная' },
]

const columns: QTableColumn[] = [
  {
    name: 'tags',
    label: 'Метки',
    field: 'tags',
    align: 'center',
  },
  {
    name: 'type',
    label: 'Тип записи',
    field: 'type',
    align: 'center',
  },
  {
    name: 'login',
    label: 'Логин',
    field: 'login',
    align: 'center',
  },
  {
    name: 'password',
    label: 'Пароль',
    field: 'password',
    align: 'center',
  },
  {
    name: 'deletable',
    label: '',
    field: 'deletable',
    align: 'center',
  },
]

const rows: Ref<Row[]> = ref(
  recordsStore.records.map((record) => {
    return constructRow(record)
  }),
)

const isLoading = ref(false)
const showHint = ref(true)

// Functions

function unpackTags(tagsArray: Record['tags']) {
  if (!Array.isArray(tagsArray) || !tagsArray) {
    return ''
  }
  return tagsArray.map((item) => item.text).join('; ')
}

function constructRow(record: Record): Row {
  const tags = unpackTags(record.tags) ?? record.tags
  return {
    id: record?.id ?? 0,
    tags: {
      fieldRef: undefined,
      field: 'input',
      fieldProps: {
        type: 'text',
        rules: [(val) => limitedLength(val, 50)],
      },
      value: tags,
    },
    type: {
      fieldRef: undefined,
      field: 'select',
      fieldProps: {
        items: recordTypes,
        rules: [required],
      },
      value: record?.type ?? '',
    },
    login: {
      fieldRef: undefined,
      field: 'input',
      fieldProps: {
        type: 'text',
        rules: [required, (val) => limitedLength(val, 100)],
      },
      value: record?.login ?? '',
    },
    password: {
      fieldRef: undefined,
      field: 'input',
      fieldProps: {
        type: 'password',
        rules: [required, (val) => limitedLength(val, 100)],
      },
      value: record?.password ?? '',
    },
  }
}

function deleteRow(id: number) {
  const index = rows.value.findIndex((row) => row.id === id)
  if (index !== undefined) {
    recordsStore.removeRecord(id)
    rows.value = [...rows.value.slice(0, index), ...rows.value.slice(index + 1)]
  }
}

function passwordCellHide(props: QTdProps['props']): boolean {
  const colName = props.col.name
  const cell = props.row[colName]
  if (cell && cell.field === 'input' && colName !== 'password') {
    return true
  } else if (colName === 'password' && props.row.type.value !== 'ldap') {
    return true
  }
  return false
}

function addRow() {
  isLoading.value = true
  const latestId = rows.value.length > 0 ? Math.max(...rows.value.map((obj) => obj.id)) + 1 : 0
  const newRecord = {
    id: latestId,
    tags: [],
    type: '',
    login: '',
    password: '',
  }
  rows.value = [...rows.value, constructRow(newRecord)]
  recordsStore.addRecord(newRecord)
  isLoading.value = false
}

function updateRecord(props: QTdProps['props']) {
  const id = props.row.id
  const field = props.col.name
  let value = props.row[props.col.name].value
  const fieldRef = props.row[props.col.name].fieldRef

  if (!fieldRef || !fieldRef.validate()) {
    return
  }

  if (field === 'tags' && value.length > 0) {
    value = value
      .split(';')
      .map((item: string) => ({ text: item.trim() }))
      .filter(Boolean)
  }

  recordsStore.updateRecord(id, {
    [field]: value,
  })

  if (field === 'type' && value === 'ldap') {
    recordsStore.updateRecord(id, {
      password: null,
    })
  }
}
</script>

<template>
  <q-table
    flat
    :rows="rows"
    :columns="columns"
    table-header-class="text-blue-grey-6"
    class="q-pa-md"
    separator="none"
    :rows-per-page-options="[50]"
  >
    <template v-slot:top>
      <div class="col q-gutter-y-md">
        <div class="full-width row">
          <span class="text-h5">Учётные записи</span>
          <q-space></q-space>
          <q-btn
            unelevated
            outline
            class="rounded-borders"
            color="secondary"
            :loading="isLoading"
            icon="add"
            label="Добавить"
            @click="addRow"
          />
        </div>
        <q-banner v-if="showHint" inline-actions rounded class="bg-accent">
          <span class="text-caption"
            >Для указания нескольких меток одной пары логин/пароль используйте разделитель ;</span
          >
          <template v-slot:action>
            <q-btn flat dense icon="close" @click="showHint = false" />
          </template>
        </q-banner>
      </div>
    </template>
    <template v-slot:body-cell="props">
      <q-td
        :props="props"
        v-if="passwordCellHide(props)"
        :colspan="props.col.name === 'login' && props.row.type.value === 'ldap' ? 2 : 1"
      >
        <q-input
          :ref="(element) => (props.row[props.col.name].fieldRef = element)"
          v-model="props.row[props.col.name].value"
          :type="props.row[props.col.name].fieldProps.type ?? 'text'"
          :rules="props.row[props.col.name].fieldProps.rules ?? undefined"
          dense
          outlined
          @blur="updateRecord(props)"
        >
          <template v-slot:append v-if="props.col.name === 'password'">
            <q-icon
              :name="
                props.row[props.col.name].fieldProps.type === 'password'
                  ? 'visibility_off'
                  : 'visibility'
              "
              class="cursor-pointer"
              @click="
                props.row[props.col.name].fieldProps.type =
                  props.row[props.col.name].fieldProps.type === 'text' ? 'password' : 'text'
              "
            />
          </template>
        </q-input>
      </q-td>
      <q-td
        :props="props"
        v-if="props.row[props.col.name] && props.row[props.col.name].field === 'select'"
      >
        <q-select
          :ref="(element) => (props.row[props.col.name].fieldRef = element)"
          style="min-width: 150px"
          emit-value
          map-options
          v-model="props.row[props.col.name].value"
          :rules="props.row[props.col.name].fieldProps.rules ?? undefined"
          :options="recordTypes"
          dense
          outlined
          @update:model-value="updateRecord(props)"
        />
      </q-td>
      <q-td :props="props" v-if="props.col.name === 'deletable'">
        <q-btn
          dense
          unelevated
          text-color="secondary"
          icon="delete"
          @click="deleteRow(props.row.id)"
        />
      </q-td>
    </template>
    <template v-slot:no-data>
      <div class="full-width row flex-center text-primary q-gutter-md">
        <q-icon size="2em" name="sentiment_dissatisfied" />
        <span> Нет данных </span>
      </div>
    </template>
  </q-table>
</template>
