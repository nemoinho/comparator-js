import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  yaml: false,
  isInEditor: false,
  typescript: {
    overrides: {
      'ts/explicit-function-return-type': ['off'],
    },
  },
})
