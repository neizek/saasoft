import { defineStore } from 'pinia'

export interface Record {
  id: number
  tags: { text: string }[]
  type: string
  login: string
  password: string | null
}

export const useRecordsStore = defineStore('records', {
  state: (): { records: Record[] } => ({
    records: [
      {
        id: 1,
        tags: [{ text: 'XXX' }],
        type: 'ldap',
        login: '',
        password: '',
      },
      {
        id: 2,
        tags: [{ text: 'XXX' }, { text: 'YYYYYYYYY' }],
        type: 'local',
        login: 'Значение',
        password: '',
      },
      {
        id: 3,
        tags: [],
        type: '',
        login: 'Значение',
        password: 'Значение',
      },
    ],
  }),
  getters: {
    getRecordById: (state) => (id: number) => {
      return state.records.find((record) => record.id === id)
    },
  },
  actions: {
    addRecord(newRecord: Record) {
      this.records.push(newRecord)
    },
    updateRecord(id: number, updatedFields: Partial<Record>) {
      const record = this.records.find((record) => record.id === id)
      if (record) {
        Object.assign(record, updatedFields)
      }
    },
    removeRecord(id: number) {
      this.records = this.records.filter((record) => record.id !== id)
    },
  },
  persist: true,
})
