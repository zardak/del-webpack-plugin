const path = require('path')
const del = require('del')
const chalk = require('chalk')

class DelWebpackPlugin {
  constructor (options) {
    this.compilerInstances = 0
    this.compilerStats = []

    this.options = {
      info: true, 
      exclude: [], 
      include: ['**'],
      ...options
    }
  }

  apply (compiler) {
    this.compilerInstances += 1

    const outputPath = compiler.options.output.path

    const callback = stats => {
      this.compilerStats.push(stats)

      if (this.compilerStats.length !== this.compilerInstances) {
        return
      }

      // check all modules work
      if (this.compilerStats.some(stats => stats.hasErrors())) {
        console.log()
        console.log(
          `${chalk.red(`Del Webpack Plugin stopped according to module failed.`)}`
        )
        return
      }

      // gather info from compiled files
      const assetNames = [].concat(...this.compilerStats.map(stats => stats.toJson().assets.map(asset => asset.name)))

      // include files, default is all files (**) under working folder
      const includePatterns = this.options.include.map(name => path.join(outputPath, name))

      // exclude files
      const excludePatterns = [
        outputPath,
        ...this.options.exclude.map(name => path.join(outputPath, name)),
        ...assetNames.map(name => path.join(outputPath, name))
      ]
  
      // run delete 
      del(includePatterns, {
        ignore: excludePatterns
      }).then(paths => {
        this.compilerStats = []

        if (this.options.info) {
          console.log()
          console.log(`===== Del Webpack Plugin ===`)
          console.log(`${chalk.green('Added files:')}`)
          assetNames.map(name => console.log(name))
          console.log()
          console.log(`${chalk.red('Deleted files:')}`)
          paths.map(name => console.log(path.basename(name)))
          console.log(`============================`)
          console.log()
        }
      })
    }

    if (compiler.hooks) {
      compiler.hooks.done.tap('del-webpack-plugin', callback)
    } else {
      compiler.plugin('done', callback)
    }
  }
}

module.exports = DelWebpackPlugin
