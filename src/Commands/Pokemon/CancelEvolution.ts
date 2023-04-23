import { BaseCommand, Command, Message } from '../../Structures'

@Command('cancel-evolution', {
    description: 'Cancels the ongoing evolution of a pokemon',
    aliases: ['del-evolution', 'cancel-evolve', 'del-evolve'],
    cooldown: 10,
    exp: 60,
    usage: 'cancel-evolution',
    category: 'pokemon'
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!this.handler.pokemonEvolutionResponse.has(M.sender.jid))
            return void M.reply("🟥 *You don't have any pokemon which is evolving right now*")
        const data = this.handler.pokemonEvolutionResponse.get(M.sender.jid)
        if (data?.group !== M.from)
            return void M.reply("🟨 *This command can only be used in the group where your pokemon's evolving*")
        this.handler.pokemonEvolutionResponse.delete(M.sender.jid)
        const chain = await this.client.utils.getPokemonEvolutionChain(data?.pokemon)
        return void M.reply(
            `🟩 Evolution of your *${this.client.utils.capitalize(data?.pokemon)}* to *${this.client.utils.capitalize(
                chain[chain.findIndex((x) => x === data?.pokemon) + 1]
            )}* has been cancelled`
        )
    }
}
