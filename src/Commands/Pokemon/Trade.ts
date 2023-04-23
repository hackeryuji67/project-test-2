import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs, IPokemonAPIResponse } from '../../Types'

@Command('trade', {
    description: "Trades pokemon in a user's party with another user's pokemon",
    category: 'pokemon',
    usage: 'trade <entry_number_of_a_pokemon_in_your_party> <name_or_pokedex_id_of_the_pokemon_to_trade_with>',
    cooldown: 35,
    aliases: ['t'],
    exp: 10,
    antiBattle: true
})
export default class command extends BaseCommand {
    override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (this.handler.pokemonTradeResponse.has(M.from))
            return void M.reply('A trade is already going on for this group')
        if (M.numbers.length < 1)
            return void M.reply(
                `Provide the entry number of a pokemon in your party along with the name or pokedex ID of the pokemon that you want for the trade. Example: *${this.client.config.prefix}trade 1 chikorita*`
            )
        const { party } = await this.client.DB.getUser(M.sender.jid)
        M.numbers.forEach((x) => (context = context.replace(x.toString(), '')))
        if (M.numbers[0] > party.length || M.numbers[0] < 1) return void M.reply("The pokemon doesn't exists")
        const index = M.numbers[0] - 1
        if (party[index].tag === '0') return void M.reply("🟥 *You can't trade your own companion*")
        const term = context.trim().split(' ')[0].toLowerCase().trim()
        if (term === '') return void M.reply('Provide the name or pokedex ID of the pokemon that you wanna trade with')
        await this.client.utils
            .fetch<IPokemonAPIResponse>(`https://pokeapi.co/api/v2/pokemon/${term}`)
            .then(async ({ name }) => {
                this.handler.pokemonTradeResponse.set(M.from, {
                    offer: party[index],
                    creator: M.sender.jid,
                    with: name
                })
                const buttons = [
                    {
                        buttonId: 'id1',
                        buttonText: { displayText: `${this.client.config.prefix}trade-confirm` },
                        type: 1
                    },
                    {
                        buttonId: 'id2',
                        buttonText: { displayText: `${this.client.config.prefix}trade-delete` },
                        type: 1
                    }
                ]
                const text = `🧧 *Pokemon Trade Started* 🧧\n\n🍥 *Offer: ${this.client.utils.capitalize(
                    party[index].name
                )}*\n\n🔮 *For: ${this.client.utils.capitalize(name)}*`
                const buttonMessage = {
                    text,
                    footer: '',
                    buttons: buttons,
                    headerType: 1
                }
                await this.client.sendMessage(M.from, buttonMessage, {
                    quoted: M.message
                })
                setTimeout(() => {
                    if (!this.handler.pokemonTradeResponse.has(M.from)) return void null
                    this.handler.pokemonTradeResponse.delete(M.from)
                    return void M.reply('Pokmeon trade cancelled')
                }, 6 * 10000)
            })
            .catch(() => {
                return void M.reply('Invalid pokemon')
            })
    }
}
