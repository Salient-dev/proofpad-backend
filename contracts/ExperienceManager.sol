// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CompanyManager.sol";
import "./CategoryManager.sol";
import "./OpenBadge.sol";
import "./OpenBadgesProfileManager.sol";

contract ExperienceManager is Ownable {
    struct Experience {
        address userAddress;
        string description;
        CategoryManager.Category category;
        CategoryManager.SubCategory subCategory;
        address companyAddress;
        bool validated;
        address openBadgeContract;
    }

    Experience[] public experiences;
    mapping(address => uint[]) private userExperiences;
    CompanyManager private companyManager;
    CategoryManager private categoryManager;
    OpenBadgesProfileManager private profileManager;
    // OpenBadge private

    event ExperienceSubmitted(address indexed userAddress, uint experienceId);
    event ExperienceValidated(address indexed validatorAddress, uint experienceId);
    event BadgeClassCreated(address indexed badgeContract, string badgeName, string badgeClassURI, address indexed companyAddress);

    modifier onlyVerifiedCompany() {
        require(companyManager.getCompany(msg.sender).status == CompanyManager.CompanyStatus.Verified, "Company not verified");
        _;
    }

    constructor(address _companyManagerAddress, address _categoryManagerAddress, address _profileManagerAddress) 
        Ownable(msg.sender)
    {
        companyManager = CompanyManager(_companyManagerAddress);
        categoryManager = CategoryManager(_categoryManagerAddress);
        profileManager = OpenBadgesProfileManager(_profileManagerAddress);
    }


    /// User submits an experience on the platform
    /// @param description The description of the experience
    /// @param category The category of the experience
    /// @param subCategory The subcategory of the experience
    /// @param companyAddress The address of the company or organism where the experience was acquired
    function submitExperience(
        string memory description,
        CategoryManager.Category category,
        CategoryManager.SubCategory subCategory,
        address companyAddress
    ) public {
        require(companyManager.getCompany(companyAddress).ethAddress != address(0), "Company does not exist");

        experiences.push(Experience({
            userAddress: msg.sender,
            description: description,
            category: category,
            subCategory: subCategory,
            companyAddress: companyAddress,
            validated: false,
            openBadgeContract: address(0)
        }));

        uint experienceId = experiences.length - 1;
        userExperiences[msg.sender].push(experienceId);

        emit ExperienceSubmitted(msg.sender, experienceId);
    }

    // function validateExperience(uint experienceId) public {
    //     Experience storage exp = experiences[experienceId];
    //     require(exp.companyAddress == msg.sender, "Only the concerned company can validate experience");
    //     require(companyManager.getCompany(msg.sender).status == CompanyManager.CompanyStatus.Verified, "Company not verified");



    //     exp.validated = true;
    //     // Create a badge for the validated experience
    //     profileManager.getOrCreateBadge(
    //         exp.description,
    //         "Criteria for the badge",
    //         "URI for badge class",
    //         exp.category,
    //         exp.subCategory
    //     );
    //     emit ExperienceValidated(msg.sender, experienceId);
    // }

    function validateExperienceForExistingBadge(uint experienceId, address nftContract, string memory newBadgeUri) public onlyVerifiedCompany {
        Experience storage exp = experiences[experienceId];
        require(exp.companyAddress == msg.sender, "Only the concerned company can validate experience");

        //deliverBadge(nftContract, exp.userAddress, newBadgeUri);
        exp.validated = true;
    }

    function validateExperienceForNonExistingBadge(uint experienceId, string memory badgeName, string memory criteria, string memory badgeClassURI, CategoryManager.Category category, CategoryManager.SubCategory subCategory) public {
        Experience storage exp = experiences[experienceId];
        require(exp.companyAddress == msg.sender, "Only the concerned company can validate experience");
        require(companyManager.getCompany(msg.sender).status == CompanyManager.CompanyStatus.Verified, "Company not verified");

        address nftContact = createBadgeClass(badgeName, criteria, badgeClassURI, category, subCategory);
    }

    // function deliverBadge(
    //     address badgeAddress,
    //     address to,
    //     string memory uri
    // ) public {
    //     OpenBadge(badgeAddress).deliverBadge(to, uri);
    // }

    // function getOrCreateBadge(
    //     string memory badgeName,
    //     string memory criteria,
    //     string memory badgeClassURI,
    //     CategoryManager.Category category,
    //     CategoryManager.SubCategory subCategory
    // ) internal returns (address) {
    //     address[] memory badgeContracts = profileManager.getOpenBadgeContracts();
        
    //     for (uint i = 0; i < badgeContracts.length; i++) {
    //         if (keccak256(abi.encodePacked(OpenBadge(badgeContracts[i]).name())) == keccak256(abi.encodePacked(badgeName))) {
    //             return badgeContracts[i];
    //         }
    //     }

    //     return profileManager.addBadge(badgeName, criteria, badgeClassURI);
    // }


    /**
     * @notice Creates a new badge class for a validated experience and adds the badge to the company's profile
     * @param badgeName - The name of the badge
     * @param criteria - The criteria for the badge
     * @param badgeClassURI - The URI of the badge class, where the JSON metadata is stored
     * @param category - The category of the badge
     * @param subCategory - The subcategory of the badge
     */
    function createBadgeClass(
        string memory badgeName,
        string memory criteria,
        string memory badgeClassURI,
        CategoryManager.Category category,
        CategoryManager.SubCategory subCategory
    ) public returns (address) { 
        OpenBadge newBadge = new OpenBadge(badgeName, msg.sender, criteria, badgeClassURI, category, subCategory);
        companyManager.addNftContract(msg.sender, address(newBadge), badgeName, badgeClassURI);

        emit BadgeClassCreated(address(newBadge), badgeName, badgeClassURI, msg.sender);
        return address(newBadge);
    }


    function getUserExperiences(address userAddress) public view returns (Experience[] memory) {
        uint[] storage expIds = userExperiences[userAddress];
        Experience[] memory userExp = new Experience[](expIds.length);

        for (uint i = 0; i < expIds.length; i++) {
            userExp[i] = experiences[expIds[i]];
        }

        return userExp;
    }


    function getAllExperiences() public view returns (Experience[] memory) {
        return experiences;
    }
}