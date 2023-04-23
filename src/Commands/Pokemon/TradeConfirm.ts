import { BaseCommand, Command, Message } from '../../Structures'
import { Pokemon } from '../../Database'

@Command('trade-confirm', {
    description: 'Confirms an ongoing pokemon trade',
    category: 'pokemon',
    usage: 'trade-confirm',
    cooldown: 15,
    aliases: ['t-confirm', 'confirm-trade', 'confirm-t'],
    antiBattle: true
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!this.handler.pokemonTradeResponse.has(M.from))
            return void M.reply("There aren't any pokemon trade going on right now for this group")
        const trade = this.handler.pokemonTradeResponse.get(M.from)
        if (trade?.creator === M.sender.jid) return void M.reply("🟥 *You can't tade with yourself*")
        const { party } = await this.client.DB.getUser(M.sender.jid)
        const i = party.findIndex((x) => x.name === (trade?.with as string))
        if (i < 0)
            return void M.reply(
                `🟥 *You can\'t proceed to this trade as you don\'t have ${this.client.utils.capitalize(
                    trade?.with as string
                )} in your party*`
            )
        const pkmn = trade?.offer as Pokemon
        const pokemon = party[i]
        if (party[i].tag === '0') return void M.reply("🟥 *You can't trade with your own companion*")
        const { party: Party } = await this.client.DB.getUser(trade?.creator as string)
        const index = Party.findIndex((x) => x.tag === pkmn.tag)
        if (index < 0) {
            this.handler.pokemonTradeResponse.delete(M.from)
            return void M.reply(
                `🟥 Pokemon trade cancelled as *@${
                    trade?.creator.split('@')[0]
                }* doesn't have the offered pokemon of the trade in his/her party`,
                'text',
                undefined,
                undefined,
                undefined,
                [trade?.creator as string]
            )
        }
        party[i] = pkmn
        Party[index] = pokemon
        await this.client.DB.user.updateOne({ jid: trade?.creator as string }, { $set: { party: Party } })
        await this.client.DB.user.updateOne({ jid: M.sender.jid }, { $set: { party } })
        this.handler.pokemonTradeResponse.delete(M.from)
        return void M.reply(
            `🎊 *Trade Completed!* 🎊\n\n*${this.client.utils.capitalize(pkmn.name)}* -----> *@${
                trade?.creator.split('@')[0]
            }*\n\n*${this.client.utils.capitalize(pokemon.name)}* -----> *@${M.sender.jid.split('@')[0]}*`,
            'text',
            undefined,
            undefined,
            undefined,
            [M.sender.jid, trade?.creator as string]
        )
    }
}
