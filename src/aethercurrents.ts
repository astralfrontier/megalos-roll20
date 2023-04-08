on('change:unlock_ac5', () => {
  getSectionIDs('repeating_powers', (idarray) => {
    getAttrs(['unlock_ac5'], (v) => {
      const output: any = {}
      idarray.forEach((id) => {
        output[`repeating_powers_${id}_unlock_ac5`] = v.unlock_ac5
      })
      setAttrs(output)
    })
  })
})
