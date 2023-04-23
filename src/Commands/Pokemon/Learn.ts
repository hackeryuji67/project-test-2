import { Message, Command, BaseCommand } from '../../Structures'
import { IArgs } from '../../Types'

@Command('learn', {
    description: 'Learns Pokemon move',
    category: 'pokemon',
    cooldown: 5,
    usage: 'learn',
    exp: 20
})
export default class extends BaseCommand {
    override execute = async (M: Message, { flags }: IArgs): Promise<void> => {
        const Data = this.handler.pokemonMoveLearningResponse.get(`${M.from}${M.sender.jid}`)
        if (!flags.length || !Data) return void M.reply(`You can't use this command yet-`)
        const { party } = await this.client.DB.getUser(M.sender.jid)
        const { data, move } = Data
        this.handler.pokemonMoveLearningResponse.delete(`${M.from}${M.sender.jid}`)
        const Move = move.name.split('-').map(this.client.utils.capitalize).join(' ')
        const i = party.findIndex((x) => x.name === data.name && x.level === data.level)
        if (flags.includes('--cancel')) {
            party[i].rejectedMoves.push(move.name)
            await this.client.DB.user.updateOne({ jid: M.sender.jid }, { $set: { party } })
            return void M.reply(`Cancelled learning *${Move}*`)
        }
        const MOve = flags[0].replace('--', '')
        const pkmn = party[i]
        const index = pkmn.moves.findIndex((x) => x.name === MOve)
        const deletedMove = party[i].moves[index].name.split('-').map(this.client.utils.capitalize).join(' ')
        party[i].rejectedMoves.push(party[i].moves[index].name)
        party[i].moves[index] = move
        await this.client.DB.user.updateOne({ jid: M.sender.jid }, { $set: { party } })
        const c = this.handler.pokemonBattlePlayerMap.get(M.from)
        if (c) {
            const data = this.handler.pokemonBattleResponse.get(c)
            if (data) {
                const turn = data.player1.user === M.sender.jid ? 'player1' : 'player2'
                if (party[i].tag === data[turn].activePokemon.tag) {
                    data[turn].activePokemon = party[i]
                    this.handler.pokemonBattleResponse.set(c, data)
                }
            }
        }
        return void (await M.reply(
            `Your *${this.client.utils.capitalize(
                party[i].name
            )}* forgot the move *${deletedMove}* and learnt the move *${Move}*`
        ))
    }
}
