on(`clicked:page`, function (event) {
  const button = event.htmlAttributes['data-tab']
  setAttrs({
    sheetTab: button,
  })
})
