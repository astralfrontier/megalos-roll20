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

// attr_status_tracker
// attr_condition_tracker
function update_status_tracker() {
  getAttrs(STATUS_LIST, (v) => {
    const O: any = {}
    O['status_tracker'] =
      STATUS_LIST.map((name) => [
        name.replace('status_save_', '').toUpperCase(),
        parseInt(v[name]),
      ])
        .filter((tuple) => tuple[1] > 0)
        .map((tuple) => ` {{${tuple[0]}=(${tuple[1]})}}`)
        .join('') || ' {{text=No Statuses}}'
    setAttrs(O)
  })
}

function update_condition_tracker() {
  getAttrs(CONDITION_LIST, (v) => {
    const O: any = {}
    O['condition_tracker'] =
      CONDITION_LIST.map((name) => [
        name.replace('condition_', '').toUpperCase(),
        parseInt(v[name]),
      ])
        .filter((tuple) => tuple[1] > 0)
        .map((tuple) => ` {{${tuple[0]}=(${tuple[1]})}}`)
        .join('') || ' {{text=No Conditions}}'
    setAttrs(O)
  })
}

for (let status of STATUS_LIST) {
  on(`change:${status}`, update_status_tracker)
}

for (let condition of CONDITION_LIST) {
  on(`change:${condition}`, update_condition_tracker)
}
