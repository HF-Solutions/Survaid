const flakes = require('simpleflakes')
const { ALREADY_VOTED, UNAVAILABLE_CHOICE } = require('./util/errors')

/**
 * A basic poll object that allows for easier tracking of surveys and polls.
 *
 * @class
 * @prop {string} label - Indicates the label/question to display.
 * @prop {string} startTime - Indicates when the poll should start.
 * @prop {string} endTime - Indicates when the poll should end.
 * @prop {Map<string, number>} values - The poll choices and their current vote count.
 * @prop {Map<string, boolean>} voters - The poll voters id and if they've voted or not.
 * @prop {boolean} allowMultiple - Indicates if a voter can vote more than once.
 * @prop {boolean} anyInput - Indicates if values that have not been previously defined can be used.
 * @prop {string} id - The unique id for this given poll, if none is provided, it is generated using `simpleflakes`.
 */
class Poll {
  /**
   *
   * @param {object} options
   * @param {string} options.label The label/descrption to display.
   * @param {string} options.startTime When the poll should start.
   * @param {string} options.endTime When the poll should end.
   * @param {string[]} [options.values] An array of acceptable choices.
   * @param {boolean} [options.allowMultiple] Whether or not a voter can vote more than once.
   * @param {boolean} [options.anyInput] Whether or not any value is acceptable.
   * @param {string} [id] The unique id for this given poll, randomly generated by default.
   */
  constructor (options, id) {
    // Set required parameters
    this.label = options.label
    this.startTime = options.startTime
    this.endTime = options.endTime

    // Set optional parameters
    if (options.values === undefined) this.values = new Map()
    else options.values.forEach(val => { this.values[val] = 0 })

    if (options.allowMultiple === undefined) this.allowMultiple = false
    else this.allowMultiple = options.allowMultiple

    if (options.anyInput === undefined) this.anyInput = false
    else this.anyInput = options.anyInput

    if (id === undefined) {
      this.id = flakes.simpleflake(Date.now(), 23).toString()
    } else this.id = id

    this.voters = new Map()
  }

  /**
   * If any input is allowed, the given choice is incremented by 1 or set to 1 if it
   * is the first time to be voted on. If not, then the given choice has its vote
   * count increased and resulting value returned.
   *
   * @param {string} choice A string representing the choice you wish to vote for.
   * @param {string} [voterId] An optional unique string representing a voter.
   * @returns {Promise<number>}
   */
  async vote (choice, voterId = 0) {
    // Verify if more than one vote is allowed
    if (this.allowMultiple) {
      return this.handleChoice(choice)
    } else {
      // Check if the user has already voted
      if (this.voters.get(voterId) === true) return Promise.reject(ALREADY_VOTED)
      else {
        // Prevent the user from voting again
        this.voters.set(voterId, true)
        return Promise.resolve(this.handleChoice(choice))
      }
    }
  }

  results () {
    let output = 'Current voting results:\n'

    this.values.forEach((val, key, map) => {
      output += `\n${key} has ${val} votes.`
    })

    return Promise.resolve(output)
  }

  /**
   * Not intended to be called by users of this module unless they know what they're doing.
   *
   * @param {string} choice
   *
   * @private
   */
  handleChoice (choice) {
    return new Promise((resolve, reject) => {
      if (this.anyInput) {
        let currVal = this.values.get(choice)

        if (currVal === undefined) {
          this.values.set(choice, 1)
        } else {
          this.values.set(choice, currVal + 1)
        }

        resolve(this.values.get(choice))
      } else {
        let currVal = this.values.get(choice)

        if (currVal === undefined) reject(UNAVAILABLE_CHOICE)
        else {
          this.values.set(choice, currVal + 1)
          resolve(this.values.get(choice))
        }
      }
    })
  }
}

module.exports = Poll
