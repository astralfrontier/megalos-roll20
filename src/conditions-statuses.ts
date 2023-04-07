const STATUS_LIST: string[] = [
  'afraid',
  'agony',
  'dazed',
  'exposed',
  'immobilized',
  'sick',
  'slowed',
  'stunned',
  'taunted',
  'wounded',
].map((name) => `status_save_${name}`)

const CONDITION_LIST: string[] = [
  'blink',
  'cloaked',
  'cover',
  'empowered',
  'focused',
  'haste',
  'regen',
  'shielded',
].map((name) => `condition_${name}`)

function update_tracker(
  attributes: string[],
  tracker: string,
  prefix: string,
  message: string
) {
  getAttrs(attributes, (v) => {
    const O: any = {}
    O[tracker] =
      attributes
        .map((name): [string, number] => [
          name.replace(prefix, '').toUpperCase(),
          parseInt(v[name]),
        ])
        .filter((tuple) => tuple[1] > 0)
        .map((tuple) => ` {{${tuple[0]}=(${tuple[1]})}}`)
        .join('') || ` {{text=${message}}}`
    setAttrs(O)
  })
}

function update_status_tracker() {
  update_tracker(STATUS_LIST, 'status_tracker', 'status_save_', 'No Statuses')
}

function update_condition_tracker() {
  update_tracker(
    CONDITION_LIST,
    'condition_tracker',
    'condition_',
    'No Conditions'
  )
}

for (let status of STATUS_LIST) {
  on(`change:${status}`, update_status_tracker)
}

for (let condition of CONDITION_LIST) {
  on(`change:${condition}`, update_condition_tracker)
}
