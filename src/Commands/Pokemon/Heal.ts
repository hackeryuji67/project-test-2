import { Command, BaseCommand, Message } from '../../Structures'

@Command('heal', {
    description: "Heals all of the Pokemon in a user's party",
    category: 'pokemon',
    antiBattle: true,
    aliases: ['restore'],
    usage: 'heal'
})
export default class extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        const { lastHeal: cd, party } = await this.client.DB.getUser(M.sender.jid)
        const time = 45 * 6 * 10000
        if (time - (Date.now() - cd) > 0) {
            const timeLeft = this.client.utils.convertMs(time - (Date.now() - cd), 'minutes') as number
            return void M.reply(
                `You have healed your Pokemon recently. Come back again in *${timeLeft}* ${
                    timeLeft >= 2 ? 'minutes' : 'minute'
                }`
            )
        }
        if (!party.length) return void M.reply("You don't have any Pokemon in your party")
        for (let i = 0; i < party.length; i++) {
            party[i].hp = party[i].maxHp
            party[i].attack = party[i].maxAttack
            party[i].defense = party[i].maxDefense
            party[i].speed = party[i].maxSpeed
            party[i].state = {
                status: '',
                movesUsed: 0
            }
            for (let j = 0; j < party[i].moves.length; j++) party[i].moves[j].pp = party[i].moves[j].maxPp
        }
        await this.client.DB.user.updateOne({ jid: M.sender.jid }, { $set: { party, lastDaily: Date.now() } })
        return void M.reply('You have healed all of the Pokemon in your party')
    }
}
