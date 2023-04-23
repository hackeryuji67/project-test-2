import { Message, Command, BaseCommand } from '../../Structures'
import { IArgs, IPokemonAPIResponse } from '../../Types'
import { proto } from '@adiwajshing/baileys'

@Command('challenge', {
    description: 'Challenges the quoted or tagged user for a Pokemon battle',
    cooldown: 15,
    exp: 35,
    category: 'pokemon',
    usage: 'challenge [tag/quote user]',
    aliases: ['ch']
})
export default class extends BaseCommand {
    override execute = async (M: Message, { flags }: IArgs): Promise<void> => {
        if (this.handler.pokemonBattleResponse.has(M.from))
            return void M.reply('A battle in this group is ongoing at the moment')
        if (!flags.length) {
            let { party } = await this.client.DB.getUser(M.sender.jid)
            party = party.filter((pkmn) => pkmn.hp > 0)
            if (!party.length)
                return void M.reply(
                    "You don't have any Pokemon (in your party) capable of battling someone right now as all of them have been fainted"
                )
            const users = M.mentioned
            if (M.quoted && !users.includes(M.quoted.sender.jid)) users.push(M.quoted.sender.jid)
            if (!users.length || users[0] === M.sender.jid)
                return void M.reply('Tag or quote a person to challenge for a match')
            const jid = users[0]
            if (this.handler.pokemonBattlePlayerMap.has(jid))
                return void M.reply(
                    `*@${
                        jid.split('@')[0]
                    }* is currently in a battle right now. So, you can't challenge hime/her at the moment`,
                    'text',
                    undefined,
                    undefined,
                    undefined,
                    [jid]
                )
            let { party: Party } = await this.client.DB.getUser(jid)
            Party = Party.filter((pkmn) => pkmn.hp > 0)
            if (!Party.length)
                return void M.reply(
                    "You can't challenge a trainer who doesn't have any active Pokemon (in his/her party)"
                )
            this.handler.pokemonChallengeResponse.set(M.from, {
                challenger: M.sender.jid,
                challengee: jid
            })
            const text = `*@${M.sender.jid.split('@')[0]}* has challenged *@${
                jid.split('@')[0]
            }* for a Pokemon battle. Use *${this.client.config.prefix}challenge --accept* to start this battle`
            const buttons: proto.Message.ButtonsMessage.IButton[] = [
                {
                    buttonId: 'id1',
                    buttonText: { displayText: `${this.client.config.prefix}challenge --accept` },
                    type: 1
                },
                {
                    buttonId: 'id2',
                    buttonText: { displayText: `${this.client.config.prefix}challenge --reject` }
                },
                {
                    buttonId: 'id2',
                    buttonText: { displayText: `${this.client.config.prefix}challenge --cancel` }
                }
            ]
            const buttonMessage = {
                text,
                buttons,
                footer: '',
                headerType: 1,
                mentions: [M.sender.jid, jid]
            }
            await this.client.sendMessage(M.from, buttonMessage, {
                quoted: M.message
            })
            setTimeout(async () => {
                if (!this.handler.pokemonChallengeResponse.has(M.from)) return void null
                this.handler.pokemonChallengeResponse.delete(M.from)
                return void M.reply("Challenge cancelled as the challenged user didn't respond")
            }, 6 * 10000 * 5)
        } else {
            switch (flags[0]) {
                default:
                    return void M.reply('Invalid Usage')
                case '--accept':
                case '--a':
                    const data = this.handler.pokemonChallengeResponse.get(M.from)
                    if (!data || data.challengee !== M.sender.jid)
                        return void M.reply('No one challenged you for a Pokemon battle')
                    this.handler.pokemonChallengeResponse.delete(M.from)
                    let { party } = await this.client.DB.getUser(M.sender.jid)
                    party = party.filter((pkmn) => pkmn.hp > 0)
                    if (!party.length)
                        return void M.reply(
                            "🟥 *Pokemon challenge cancelled as you don't have any Pokemon (in your party) capable of battling someone right now as all of them have been fainted*"
                        )
                    const Data = (await this.client.DB.getUser(data.challenger)).party.filter((pkmn) => pkmn.hp > 0)
                    this.handler.pokemonBattleResponse.set(M.from, {
                        player1: {
                            user: data.challenger,
                            ready: false,
                            move: '',
                            activePokemon: Data[0]
                        },
                        player2: {
                            user: M.sender.jid,
                            ready: false,
                            move: '',
                            activePokemon: party[0]
                        },
                        turn: 'player1',
                        players: [data.challenger, M.sender.jid]
                    })
                    this.handler.pokemonBattlePlayerMap.set(M.sender.jid, M.from)
                    this.handler.pokemonBattlePlayerMap.set(data.challenger, M.from)
                    const image = await this.client.utils.drawPokemonBattle({
                        player1: { activePokemon: Data[0], party: Data },
                        player2: { activePokemon: party[0], party }
                    })
                    if (!party[0].types) {
                        const { types } = await this.client.utils.fetch<IPokemonAPIResponse>(
                            `https://pokeapi.co/api/v2/pokemon/${party[0].name}`
                        )
                        party[0].types = types.map((type) => type.type.name)
                        await this.client.DB.user.updateOne({ jid: M.sender.jid }, { $set: { party } })
                    }
                    if (!Data[0].types) {
                    }
                    await this.client.sendMessage(M.from, {
                        image,
                        caption: `🌀 *Pokemon Battle Started!* 🌀\n\n*@${
                            data.challenger.split('@')[0]
                        } - ${this.client.utils.capitalize(Data[0].name)} (HP: ${Data[0].hp} / ${
                            Data[0].maxHp
                        } | Level: ${Data[0].level} | Moves: ${
                            Data[0].moves.length
                        } | Type: ${this.client.utils.capitalize(Data[0].types[0])})*\n\n*@${
                            M.sender.jid.split('@')[0]
                        } - ${this.client.utils.capitalize(party[0].name)} (HP: ${party[0].hp} / ${
                            party[0].maxHp
                        } | Level: ${party[0].level} | Moves: ${
                            party[0].moves.length
                        } | Type: ${this.client.utils.capitalize(party[0].types[0])})*`,
                        mentions: [M.sender.jid, data.challenger]
                    })
                    const rows: proto.Message.ListMessage.IRow[] = []
                    const options = ['Fight', 'Pokemon', 'Forfeit']
                    for (let i = 0; i < 3; i++) {
                        rows.push({
                            title: options[i],
                            rowId: `${this.client.config.prefix}battle ${options[i].toLowerCase()}`
                        })
                    }
                    const sections: proto.Message.ListMessage.ISection[] = [
                        {
                            title: 'Options',
                            rows
                        }
                    ]
                    return void (await this.client.sendMessage(M.from, {
                        text: `Select one of the rows given below\n*@${data.challenger.split('@')[0]}*`,
                        sections,
                        buttonText: 'Battle Options',
                        footer: '',
                        mentions: [data.challenger]
                    }))

                case '--reject':
                case '--r':
                    const DATA = this.handler.pokemonChallengeResponse.get(M.from)
                    if (!DATA || DATA.challengee !== M.sender.jid)
                        return void M.reply('No one challenged you for a Pokemon battle')
                    this.handler.pokemonChallengeResponse.delete(M.from)
                    return void M.reply(
                        `You have rejected *@${DATA.challenger.split('@')[0]}* challenge`,
                        'text',
                        undefined,
                        undefined,
                        undefined,
                        [DATA.challenger]
                    )

                case '--cancel':
                case '--c':
                    const DAta = this.handler.pokemonChallengeResponse.get(M.from)
                    if (!DAta || DAta.challenger !== M.sender.jid) return void M.reply("You didn't challenge anyone")
                    this.handler.pokemonChallengeResponse.delete(M.from)
                    return void M.reply('You cancelled your own challenge')
            }
        }
    }
}
