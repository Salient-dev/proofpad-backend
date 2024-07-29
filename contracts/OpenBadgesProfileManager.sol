// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OpenBadge.sol";
import "./CategoryManager.sol";
import "hardhat/console.sol";

contract OpenBadgesProfileManager {

    struct Profile {
        address ethAddress;
        string kind;
        string didProfileURL;
        address[] openBadgesReceived;
    }

    struct Organisation {
        address ethAddress;
        string kind;
        string didProfileURL;
        address[] openBadgeContracts;
        address[] members;
    }

    mapping(address => Profile) private _profiles;
    mapping(address => Organisation) private _organisations;

    address[] private profileAddresses;
    address[] private organisationAddresses;
    uint256 private _numberOfProfiles;
    uint256 private _numberOfOrganisations;

    address private immutable adminOwner;

    event OpenbadgeDeployed(address indexed badgeAddress, string indexed badgeName);

    modifier onlyInTheProfileList() {
        require(
            _profiles[msg.sender].ethAddress != address(0),
            "Profile does not exist"
        );
        _;
    }

    modifier onlyOrganisations() {
        require(
            keccak256(abi.encodePacked(_profiles[msg.sender].kind)) == keccak256(abi.encodePacked("university")) ||
                keccak256(abi.encodePacked(_profiles[msg.sender].kind)) == keccak256(abi.encodePacked("company")) ||
                keccak256(abi.encodePacked(_profiles[msg.sender].kind)) == keccak256(abi.encodePacked("organisation")),
            "Only organisations can call this func"
        );
        _;
    }

    constructor() {
        adminOwner = msg.sender;
        _numberOfProfiles = 0;
        _numberOfOrganisations = 0;
    }

    function getOwner() public view returns (address) {
        return adminOwner;
    }

    function getAllProfiles() public view returns (Profile[] memory) {
        Profile[] memory profileList = new Profile[](_numberOfProfiles);

        for (uint i = 0; i < _numberOfProfiles; i++) {
            profileList[i] = _profiles[profileAddresses[i]];
        }
        return profileList;
    }

    function getAllProfileAdresses() public view returns (address[] memory) {
        return profileAddresses;
    }

    function getAllOrganisations() public view returns (Organisation[] memory) {
        Organisation[] memory organisationList = new Organisation[](_numberOfOrganisations);

        for (uint i = 0; i < _numberOfOrganisations; i++) {
            organisationList[i] = _organisations[organisationAddresses[i]];
        }
        return organisationList;
    }

    function getAllOrganisationAddresses() public view returns (address[] memory) {
        return organisationAddresses;
    }

    function createProfile(
        string memory didProfileURL,
        string memory kind
    ) public {
        require(
            _profiles[msg.sender].ethAddress == address(0),
            "Profile already exists"
        );
        _profiles[msg.sender] = Profile(msg.sender, kind, didProfileURL, new address[](0));
        profileAddresses.push(msg.sender);
        _numberOfProfiles++;

        if (isOrganisation(kind)) {
            _organisations[msg.sender] = Organisation(msg.sender, kind, didProfileURL, new address[](0), new address[](0));
            organisationAddresses.push(msg.sender);
            _numberOfOrganisations++;
        }
    }

    function addMemberToOrganisation(
        address profile
    ) public onlyInTheProfileList onlyOrganisations {
        _organisations[msg.sender].members.push(profile);
    }

    function getOrCreateBadge(
        string memory badgeName,
        string memory criteria,
        string memory badgeClassURI,
        CategoryManager.Category category,
        CategoryManager.SubCategory subCategory
    ) public returns (address) {
        address[] memory badgeContracts = getOpenBadgeContracts();
        
        for (uint i = 0; i < badgeContracts.length; i++) {
            if (keccak256(abi.encodePacked(OpenBadge(badgeContracts[i]).name())) == keccak256(abi.encodePacked(badgeName))) {
                return badgeContracts[i];
            }
        }

        return addBadge(badgeName, criteria, badgeClassURI);
    }

    function addBadge(
        string memory badgeName,
        string memory criteria,
        string memory badgeClassURI
    ) public onlyInTheProfileList onlyOrganisations returns (address) {
        OpenBadge newBadge = new OpenBadge(badgeName, msg.sender, criteria, badgeClassURI);
        _organisations[msg.sender].openBadgeContracts.push(address(newBadge));
        emit OpenbadgeDeployed(address(newBadge), badgeName);
        return address(newBadge);
    }
    
    function deliverBadge(
        address badgeAddress,
        address to,
        string memory uri
    ) public onlyInTheProfileList onlyOrganisations {
        require(
            contains(_organisations[msg.sender].openBadgeContracts, badgeAddress),
            "Badge does not exist"
        );
        require(
            contains(_organisations[msg.sender].members, to),
            "Recipient is not a member of the organisation"
        );

        OpenBadge(badgeAddress).deliverBadge(to, uri);
    }

    function getOwnProfile() public view onlyInTheProfileList returns (Profile memory) {
        return _profiles[msg.sender];
    }

    function getDidProfileURL() public view onlyInTheProfileList returns (string memory) {
        return getOwnProfile().didProfileURL;
    }

    function getOpenBadgeContracts() public view onlyInTheProfileList onlyOrganisations returns (address[] memory) {
        return _organisations[msg.sender].openBadgeContracts;
    }

    function getOrganisationMembers() public view onlyInTheProfileList onlyOrganisations returns (address[] memory) {
        return _organisations[msg.sender].members;
    }

    function isOrganisation(string memory kind) private view onlyInTheProfileList returns (bool) {
        return keccak256(abi.encodePacked(kind)) == keccak256(abi.encodePacked("university")) ||
                keccak256(abi.encodePacked(kind)) == keccak256(abi.encodePacked("company")) ||
                keccak256(abi.encodePacked(kind)) == keccak256(abi.encodePacked("organisation"));
    }

    function contains(address[] memory array, address element) private pure returns (bool) {
    for (uint i = 0; i < array.length; i++) {
        if (array[i] == element) {
            return true;
        }
    }
    return false;
}
    // -- VERIFIER LORSQU'UN ETUDIANT CREE SON PROFIL QU'IL FAIT BIEN PARTIE DE L'ORGANISATION
    // -- AVOIR LA LISTE DE TOUTES LES ORGANISATIONS DANS LE FORM POUR QUE L'ETUDIANT OU LE SPORTIF PUISSE CHOISIR
    // -- AVOIR LA LISTE DES MEMBRES DE L'ORGANISATION OU AUX PARTICIPANTS AUX EVENEMENTS DANS LE FORM POUR QUE L'ORGANISATION PUISSE CHOISIR A QUI DELIVRER SES BADGES
    // -- AVOIR LA LISTE DES BADGES DISPONIBLES DANS LE FORM POUR QUE L'ORGANISATION PUISSE CHOISIR LEQUEL DELIVRER
}