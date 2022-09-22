import { AnyHedgeManager, SettlementType } from '@generalprotocols/anyhedge'
import ago from 's-ago'

export function formatTimestampToText(timestamp) {
  const dateObj = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(dateObj)
}
export function formatDate (date) {
  return ago(new Date(date))
}

export function formatUnits(value, decimals) {
  return Math.round(Number(value)) / 10 ** decimals
}

export function formatCentsToUSD(value) {
  return formatUnits(value, 2)
}

/**
 * 
 * @param {String} value 
 * @param {{ start: Number, end: Number }} config 
 */
export function ellipsisText (value, config) {
  const _config = Object.assign({
    start: 15,
    end: 10,
  }, config)
  _config.breakLength = _config.start + _config.end - 5
  if (typeof value !== 'string') return ''
  if (value.length <= _config.breakLength) return value
  return value.substr(0, _config.start) + '...' + value.substr(value.length - _config.end, value.length)
}

/**
 * 
 * @typedef {Object} FundingProposalAPI
 * @property {String} tx_hash
 * @property {Number} tx_index
 * @property {Number} tx_value
 * @property {String} script_sig
 * 
 * @typedef {Object} SettlementAPI
 * @property {String} spending_transaction
 * @property {SettlementType} settlement_type
 * @property {Number} hedge_satoshis
 * @property {Number} long_satoshis
 * @property {String} oracle_pubkey
 * @property {Number} settlement_price
 * @property {Number} settlement_price_sequence
 * @property {Number} settlement_message_sequence
 * @property {Number} settlement_message_timestamp
 * 
 * @typedef {Object} FundingAPI
 * @property {String} tx_hash
 * @property {Number} funding_satoshis
 * @property {Number} funding_output
 * @property {Number|undefined|null} fee_satoshis
 * @property {Number|undefined|null} fee_output
*/

/**
 * 
 * @param {Object} data 
 * @param {String} data.address - Address of hedge position contract
 * @param {String} data.anyhedge_contract_version - Version used for hedge contract
 * @param {Number} data.satoshis - Hedge value in satoshis
 * @param {Number} data.start_timestamp
 * @param {Number} data.maturity_timestamp
 * @param {String} data.hedge_address
 * @param {String} data.hedge_pubkey
 * @param {String} data.long_address
 * @param {String} data.long_pubkey
 * @param {String} data.oracle_pubkey
 * @param {Number} data.start_price
 * @param {Number} data.low_liquidation_multiplier
 * @param {Number} data.high_liquidation_multiplier
 * @param {String|null} data.funding_tx_hash
 * @param {Boolean|null} data.funding_tx_hash_validated
 * @param {{ address: String, satoshis: Number }} data.fee
 * @param {FundingProposalAPI|null} data.hedge_funding_proposal
 * @param {FundingProposalAPI|null} data.long_funding_proposal
 * @param {SettlementAPI|null} data.settlement
 * @param {FundingAPI|null} data.funding
 * 
 * @returns 
 */
export async function parseHedgePositionData(data) {
  const units = (data.satoshis * data.start_price) / 10**8
  const contractCreationParameters = {
    nominalUnits: units,
    duration: data.maturity_timestamp - data.start_timestamp,
    startPrice: data.start_price,
    startTimestamp: data.start_timestamp,
    oraclePublicKey: data.oracle_pubkey,
    highLiquidationPriceMultiplier: data.high_liquidation_multiplier,
    lowLiquidationPriceMultiplier: data.low_liquidation_multiplier,
    hedgePublicKey: data.hedge_pubkey,
    longPublicKey: data.long_pubkey,
    hedgeAddress: data.hedge_address,
    longAddress: data.long_address,
  }
  // const contractCreationParameters = {
  //   oraclePublicKey: data.oracle_pubkey,
  //   hedgePublicKey: data.hedge_pubkey,
  //   longPublicKey: data.long_pubkey,
  //   hedgeUnits: units,
  //   startPrice: data.start_price,
  //   startTimestamp: data.start_timestamp,
  //   earliestLiquidationModifier: 0,
  //   maturityModifier: data.maturity_timestamp - data.start_timestamp,
  //   highLiquidationPriceMultiplier: data.high_liquidation_multiplier,
  //   lowLiquidationPriceMultiplier: data.low_liquidation_multiplier,
  // }

  const contractData = await compileContract(contractCreationParameters, data.anyhedge_contract_version)
  if (contractData.address !== data.address) {
    console.warn(
      `Address mismatch when parsing hedge position got: "${contractData.address}" instead of "${data.address}"`,
      data,
      contractData,
    )
  }

  contractData.fundingTxHash = data.funding_tx_hash
  // contractData.fundingTxHash = 'bb743a47d81e8da85e2a0aebd03fd1be29d9703f23c0f431caf714c3e8588498'
  if (data?.funding_tx_hash) {
    contractData.funding = [{
      fundingTransaction: data.funding_tx_hash,
      // some data is actually missing here
    }]
  }


  // const fundingProposal = {
  //   tx_hash: 'bb743a47d81e8da85e2a0aebd03fd1be29d9703f23c0f431caf714c3e8588498',
  //   tx_index: 0,
  //   tx_value: 1000000,
  //   script_sig: '',
  // }
  contractData.hedgeFundingProposal = data.hedge_funding_proposal
  contractData.longFundingProposal = data.long_funding_proposal
  // contractData.hedgeFundingProposal = Object.assign({}, fundingProposal)
  // contractData.longFundingProposal = Object.assign({}, fundingProposal)

  if (data?.fee?.address && data?.fee?.satoshis) {
    contractData.fee = {
      address: data.fee.address,
      satoshis: data.fee.satoshis,
    }
  }

  if (data?.funding?.tx_hash && data?.funding?.funding_satoshis) {
    contractData.funding = [{
      fundingTransaction: data.funding.tx_hash,
      fundingSatoshis: data.funding.funding_satoshis,
      fundingOutput: data.funding.funding_output,
      feeSatoshis: data.funding.fee_satoshis || undefined,
      feeOutput: data.funding.fee_output || undefined,
    }]
  }

  if (data?.settlement) {
    contractData.settlement = [{
      spendingTransaction: data.settlement.spending_transaction,
      settlementType: data.settlement.settlement_type,
      hedgeSatoshis: data.settlement.hedge_satoshis,
      longSatoshis: data.settlement.long_satoshis,
      oraclePublicKey: data.settlement.oracle_pubkey,
      settlementPrice: data.settlement.settlement_price,

      // Not actually part of ContractDataV1's settlement interface in anyhedge
      settlementPriceSequence: data.settlement.settlement_price_sequence,
      settlementMessageSequence: data.settlement.settlement_message_sequence,
      settlementMessageTimestamp: data.settlement.settlement_message_timestamp,
    }]
  }

  return contractData
}

export async function compileContract(contractCreationParameters, contractVersion) {
  const manager = new AnyHedgeManager({ contractVersion: contractVersion })
  const contractData = await manager.createContract(contractCreationParameters)
  return contractData
}
