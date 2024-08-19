// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";


contract CompanyManager is Ownable {
    enum CompanyStatus { Pending, Verified }

    struct Company {
        address ethAddress;
        string name;
        CompanyStatus status;
        address[] nftContracts; // List of associated NFT contract addresses
        string didProfileURL;
    }

    mapping(address => Company) private companies;
    address[] private companyAddresses;

    event CompanySubmitted(address indexed companyAddress, string name);
    event CompanyVerified(address indexed companyAddress);
    event NFTContractAdded(address indexed companyAddress, string badgeName, string badgeClassURI, address nftContractAddress);

    constructor() Ownable(msg.sender) {}

    function submitCompany(string memory _name, string memory _didProfileURL) public {
        require(companies[msg.sender].ethAddress == address(0), "Company already exists");

        companies[msg.sender] = Company({
            ethAddress: msg.sender,
            name: _name,
            status: CompanyStatus.Pending,
            nftContracts: new address[] (0), // Empty array of addresses 0x0
            didProfileURL: _didProfileURL
        });

        companyAddresses.push(msg.sender);
        emit CompanySubmitted(msg.sender, _name);
    }

    /**
     * @notice (ADMIN) Verifies a company on the platform (only after KYB)
     * @dev Throws if called by any account other than the owner.
     * @param companyAddress  - The address of the company to verify
     */
    function verifyCompany(address companyAddress) public onlyOwner {
        require(companies[companyAddress].ethAddress != address(0), "Company does not exist");
        require(companies[companyAddress].status == CompanyStatus.Pending, "Company already verified");

        companies[companyAddress].status = CompanyStatus.Verified;
        emit CompanyVerified(companyAddress);
    }

    function getCompany(address companyAddress) public view returns (Company memory) {
        return companies[companyAddress];
    }

    function getNftContracts(address companyAddress) public view returns (address[] memory) {
        return companies[companyAddress].nftContracts;
    }


    function addNftContract(address companyAddress, address nftContractAddress, string memory badgeName, string memory badgeClassURI) external {
        require(companies[companyAddress].ethAddress != address(0), "Company does not exist");

        companies[companyAddress].nftContracts.push(nftContractAddress);
        //emit NFTContractAdded(companyAddress, badgeName, badgeClassURI, nftContractAddress);
    }

    function getAllCompanies() public view returns (Company[] memory) {
        Company[] memory companyList = new Company[](companyAddresses.length);

        for (uint i = 0; i < companyAddresses.length; i++) {
            companyList[i] = companies[companyAddresses[i]];
        }

        return companyList;
    }
}