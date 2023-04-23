import { BaseCommand, Command, Message } from '../../Structures'

@Command('swap', {
    description: "Swaps the entry of a user's pokemon party",
    category: 'pokemon',
    usage: 'swap <entry_number_of_the_pokemon_to_be_swapped> <entry_number_of_the_pokemon_to_be_swapped_with>',
    exp: 10,
    cooldown: 15,
    antiBattle: true
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (M.numbers.length < 2)
            return void M.reply(
                `Provide the entry numbers of pokemon to be swapped. Example: *${this.client.config.prefix}swap 1 4*`
            )
        const data = await this.client.DB.getUser(M.sender.jid)
        if (
            M.numbers[0] > data.party.length ||
            M.numbers[1] > data.party.length ||
            M.numbers[0] < 1 ||
            M.numbers[1] < 1
        )
            return void M.reply('Invaild entry number of pokemon in your party')
        const t = data.party[M.numbers[0] - 1]
        data.party[M.numbers[0] - 1] = data.party[M.numbers[1] - 1]
        data.party[M.numbers[1] - 1] = t
        await this.client.DB.user.updateOne({ jid: M.sender.jid }, { $set: { party: data.party } })
        return void M.reply(`🟩 *Swapped ${M.numbers[0]} & ${M.numbers[1]}*`)
    }
}
