const buttonlist = ['page1', 'page2', 'page3', 'page4']
buttonlist.forEach((button) => {
  on(`clicked:${button}`, function () {
    setAttrs({
      sheetTab: button,
    })
  })
})