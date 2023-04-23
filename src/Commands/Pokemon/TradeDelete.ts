import { BaseCommand, Command, Message } from '../../Structures'

@Command('trade-delete', {
    category: 'pokemon',
    description: 'Deletes the ongoing trade of a group',
    usage: 'trade-delete',
    cooldown: 10,
    exp: 10,
    aliases: ['del-trade', 'delete-trade', 't-delete', 't-del'],
    antiBattle: true
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!this.handler.pokemonTradeResponse.has(M.from))
            return void M.reply("There aren't any pokemon trade going on right now for this group")
        const trade = this.handler.pokemonTradeResponse.get(M.from)
        if (trade?.creator !== M.sender.jid) return void M.reply('The user who started this trade can only delete it')
        this.handler.pokemonTradeResponse.delete(M.from)
        return void M.reply('Pokemon trade deleted')
    }
}
