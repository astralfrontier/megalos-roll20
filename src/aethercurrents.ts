on(
  'change:unlock_ac5 change:aether_current_1 change:aether_current_2 change:aether_current_3 change:aether_current_4 change:aether_current_5',
  (event) => {
    const attr = event.sourceAttribute || ''
    getSectionIDs('repeating_powers', (idarray) => {
      getAttrs([attr], (v) => {
        const output: any = {}
        idarray.forEach((id) => {
          output[`repeating_powers_${id}_${attr}`] = v[attr]
        })
        setAttrs(output)
      })
    })
  }
)
