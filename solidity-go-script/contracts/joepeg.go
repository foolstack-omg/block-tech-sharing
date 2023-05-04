// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package contracts

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
)

// MakerOrder is an auto generated low-level Go binding around an user-defined struct.
type MakerOrder struct {
	IsOrderAsk         bool
	Signer             common.Address
	Collection         common.Address
	Price              *big.Int
	TokenId            *big.Int
	Amount             *big.Int
	Strategy           common.Address
	Currency           common.Address
	Nonce              *big.Int
	StartTime          *big.Int
	EndTime            *big.Int
	MinPercentageToAsk *big.Int
	Params             []byte
	V                  uint8
	R                  [32]byte
	S                  [32]byte
}

// JoepegMetaData contains all meta data concerning the Joepeg contract.
var JoepegMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"asset\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"premium\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"initiator\",\"type\":\"address\"},{\"internalType\":\"bytes\",\"name\":\"params\",\"type\":\"bytes\"}],\"name\":\"executeOperation\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"bool\",\"name\":\"isOrderAsk\",\"type\":\"bool\"},{\"internalType\":\"address\",\"name\":\"signer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"collection\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"price\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"currency\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"nonce\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"startTime\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"endTime\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"minPercentageToAsk\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"params\",\"type\":\"bytes\"},{\"internalType\":\"uint8\",\"name\":\"v\",\"type\":\"uint8\"},{\"internalType\":\"bytes32\",\"name\":\"r\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"s\",\"type\":\"bytes32\"}],\"internalType\":\"structMakerOrder\",\"name\":\"order\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"bool\",\"name\":\"isOrderAsk\",\"type\":\"bool\"},{\"internalType\":\"address\",\"name\":\"signer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"collection\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"price\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"strategy\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"currency\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"nonce\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"startTime\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"endTime\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"minPercentageToAsk\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"params\",\"type\":\"bytes\"},{\"internalType\":\"uint8\",\"name\":\"v\",\"type\":\"uint8\"},{\"internalType\":\"bytes32\",\"name\":\"r\",\"type\":\"bytes32\"},{\"internalType\":\"bytes32\",\"name\":\"s\",\"type\":\"bytes32\"}],\"internalType\":\"structMakerOrder\",\"name\":\"offerOrder\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"code\",\"type\":\"uint256\"}],\"name\":\"go\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"erc20s\",\"type\":\"address[]\"}],\"name\":\"withdraw\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"stateMutability\":\"payable\",\"type\":\"receive\"}]",
}

// JoepegABI is the input ABI used to generate the binding from.
// Deprecated: Use JoepegMetaData.ABI instead.
var JoepegABI = JoepegMetaData.ABI

// Joepeg is an auto generated Go binding around an Ethereum contract.
type Joepeg struct {
	JoepegCaller     // Read-only binding to the contract
	JoepegTransactor // Write-only binding to the contract
	JoepegFilterer   // Log filterer for contract events
}

// JoepegCaller is an auto generated read-only Go binding around an Ethereum contract.
type JoepegCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// JoepegTransactor is an auto generated write-only Go binding around an Ethereum contract.
type JoepegTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// JoepegFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type JoepegFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// JoepegSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type JoepegSession struct {
	Contract     *Joepeg           // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// JoepegCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type JoepegCallerSession struct {
	Contract *JoepegCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// JoepegTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type JoepegTransactorSession struct {
	Contract     *JoepegTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// JoepegRaw is an auto generated low-level Go binding around an Ethereum contract.
type JoepegRaw struct {
	Contract *Joepeg // Generic contract binding to access the raw methods on
}

// JoepegCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type JoepegCallerRaw struct {
	Contract *JoepegCaller // Generic read-only contract binding to access the raw methods on
}

// JoepegTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type JoepegTransactorRaw struct {
	Contract *JoepegTransactor // Generic write-only contract binding to access the raw methods on
}

// NewJoepeg creates a new instance of Joepeg, bound to a specific deployed contract.
func NewJoepeg(address common.Address, backend bind.ContractBackend) (*Joepeg, error) {
	contract, err := bindJoepeg(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Joepeg{JoepegCaller: JoepegCaller{contract: contract}, JoepegTransactor: JoepegTransactor{contract: contract}, JoepegFilterer: JoepegFilterer{contract: contract}}, nil
}

// NewJoepegCaller creates a new read-only instance of Joepeg, bound to a specific deployed contract.
func NewJoepegCaller(address common.Address, caller bind.ContractCaller) (*JoepegCaller, error) {
	contract, err := bindJoepeg(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &JoepegCaller{contract: contract}, nil
}

// NewJoepegTransactor creates a new write-only instance of Joepeg, bound to a specific deployed contract.
func NewJoepegTransactor(address common.Address, transactor bind.ContractTransactor) (*JoepegTransactor, error) {
	contract, err := bindJoepeg(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &JoepegTransactor{contract: contract}, nil
}

// NewJoepegFilterer creates a new log filterer instance of Joepeg, bound to a specific deployed contract.
func NewJoepegFilterer(address common.Address, filterer bind.ContractFilterer) (*JoepegFilterer, error) {
	contract, err := bindJoepeg(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &JoepegFilterer{contract: contract}, nil
}

// bindJoepeg binds a generic wrapper to an already deployed contract.
func bindJoepeg(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(JoepegABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Joepeg *JoepegRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Joepeg.Contract.JoepegCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Joepeg *JoepegRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Joepeg.Contract.JoepegTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Joepeg *JoepegRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Joepeg.Contract.JoepegTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Joepeg *JoepegCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Joepeg.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Joepeg *JoepegTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Joepeg.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Joepeg *JoepegTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Joepeg.Contract.contract.Transact(opts, method, params...)
}

// ExecuteOperation is a paid mutator transaction binding the contract method 0x1b11d0ff.
//
// Solidity: function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes params) returns(bool)
func (_Joepeg *JoepegTransactor) ExecuteOperation(opts *bind.TransactOpts, asset common.Address, amount *big.Int, premium *big.Int, initiator common.Address, params []byte) (*types.Transaction, error) {
	return _Joepeg.contract.Transact(opts, "executeOperation", asset, amount, premium, initiator, params)
}

// ExecuteOperation is a paid mutator transaction binding the contract method 0x1b11d0ff.
//
// Solidity: function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes params) returns(bool)
func (_Joepeg *JoepegSession) ExecuteOperation(asset common.Address, amount *big.Int, premium *big.Int, initiator common.Address, params []byte) (*types.Transaction, error) {
	return _Joepeg.Contract.ExecuteOperation(&_Joepeg.TransactOpts, asset, amount, premium, initiator, params)
}

// ExecuteOperation is a paid mutator transaction binding the contract method 0x1b11d0ff.
//
// Solidity: function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes params) returns(bool)
func (_Joepeg *JoepegTransactorSession) ExecuteOperation(asset common.Address, amount *big.Int, premium *big.Int, initiator common.Address, params []byte) (*types.Transaction, error) {
	return _Joepeg.Contract.ExecuteOperation(&_Joepeg.TransactOpts, asset, amount, premium, initiator, params)
}

// Go is a paid mutator transaction binding the contract method 0xdb1b944d.
//
// Solidity: function go((bool,address,address,uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes,uint8,bytes32,bytes32) order, (bool,address,address,uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes,uint8,bytes32,bytes32) offerOrder, uint256 code) returns()
func (_Joepeg *JoepegTransactor) Go(opts *bind.TransactOpts, order MakerOrder, offerOrder MakerOrder, code *big.Int) (*types.Transaction, error) {
	return _Joepeg.contract.Transact(opts, "go", order, offerOrder, code)
}

// Go is a paid mutator transaction binding the contract method 0xdb1b944d.
//
// Solidity: function go((bool,address,address,uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes,uint8,bytes32,bytes32) order, (bool,address,address,uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes,uint8,bytes32,bytes32) offerOrder, uint256 code) returns()
func (_Joepeg *JoepegSession) Go(order MakerOrder, offerOrder MakerOrder, code *big.Int) (*types.Transaction, error) {
	return _Joepeg.Contract.Go(&_Joepeg.TransactOpts, order, offerOrder, code)
}

// Go is a paid mutator transaction binding the contract method 0xdb1b944d.
//
// Solidity: function go((bool,address,address,uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes,uint8,bytes32,bytes32) order, (bool,address,address,uint256,uint256,uint256,address,address,uint256,uint256,uint256,uint256,bytes,uint8,bytes32,bytes32) offerOrder, uint256 code) returns()
func (_Joepeg *JoepegTransactorSession) Go(order MakerOrder, offerOrder MakerOrder, code *big.Int) (*types.Transaction, error) {
	return _Joepeg.Contract.Go(&_Joepeg.TransactOpts, order, offerOrder, code)
}

// Withdraw is a paid mutator transaction binding the contract method 0xbd5dec98.
//
// Solidity: function withdraw(address[] erc20s) returns()
func (_Joepeg *JoepegTransactor) Withdraw(opts *bind.TransactOpts, erc20s []common.Address) (*types.Transaction, error) {
	return _Joepeg.contract.Transact(opts, "withdraw", erc20s)
}

// Withdraw is a paid mutator transaction binding the contract method 0xbd5dec98.
//
// Solidity: function withdraw(address[] erc20s) returns()
func (_Joepeg *JoepegSession) Withdraw(erc20s []common.Address) (*types.Transaction, error) {
	return _Joepeg.Contract.Withdraw(&_Joepeg.TransactOpts, erc20s)
}

// Withdraw is a paid mutator transaction binding the contract method 0xbd5dec98.
//
// Solidity: function withdraw(address[] erc20s) returns()
func (_Joepeg *JoepegTransactorSession) Withdraw(erc20s []common.Address) (*types.Transaction, error) {
	return _Joepeg.Contract.Withdraw(&_Joepeg.TransactOpts, erc20s)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_Joepeg *JoepegTransactor) Receive(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Joepeg.contract.RawTransact(opts, nil) // calldata is disallowed for receive function
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_Joepeg *JoepegSession) Receive() (*types.Transaction, error) {
	return _Joepeg.Contract.Receive(&_Joepeg.TransactOpts)
}

// Receive is a paid mutator transaction binding the contract receive function.
//
// Solidity: receive() payable returns()
func (_Joepeg *JoepegTransactorSession) Receive() (*types.Transaction, error) {
	return _Joepeg.Contract.Receive(&_Joepeg.TransactOpts)
}
