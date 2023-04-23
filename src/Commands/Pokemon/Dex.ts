import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('pokedex', {
    description: "Displays user's pokemon dex",
    aliases: ['dex'],
    exp: 20,
    cooldown: 15,
    usage: 'pokedex || pokedex --sort',
    category: 'pokemon'
})
export default class command extends BaseCommand {
    override execute = async (M: Message, { flags }: IArgs): Promise<void> => {
        const { party, pc, tag } = await this.client.DB.getUser(M.sender.jid)
        const pokemons = [...party, ...pc]
        if (pokemons.length < 1) return void M.reply("You haven't caught any pokemon yet")
        const sorted = flags.includes('--sort')
        if (sorted) pokemons.sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0))
        let text = `🔗 *Pokedex*\n\n🎴 *ID:*\n\t🏮 *Username:* ${M.sender.username}\n\t🧧 *Tag:* #${tag}\n\n❄ *Total Pokemon:* ${pokemons.length}\n💠 *Pokemon:*\n`
        pokemons.forEach((x) => (text += `\n*❯ ${this.client.utils.capitalize(x.name)}*`))
        const buttons = [
            {
                buttonId: 'id1',
                buttonText: { displayText: `${this.client.config.prefix}party` },
                type: 1
            },
            {
                buttonId: 'id2',
                buttonText: { displayText: `${this.client.config.prefix}pc` },
                type: 1
            }
        ]
        const buttonMessage = {
            text,
            footer: '',
            buttons: buttons,
            headerType: 1
        }
        return void (await this.client.sendMessage(M.from, buttonMessage, {
            quoted: M.message
        }))
    }
}
